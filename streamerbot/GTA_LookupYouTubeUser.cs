using System;
using System.Collections.Generic;
using Newtonsoft.Json;

public class CPHInline
{
    // Helper that safely reads a YouTube User Variable regardless of whether SB stored it as string, int, long, double, or bool
    private object SafeGetYouTubeVar(string userIdOrName, string varName, bool byId)
    {
        if (string.IsNullOrEmpty(userIdOrName) || string.IsNullOrEmpty(varName))
            return null;

        // 1. Try String first
        try
        {
            string sVal = byId
                ? CPH.GetYouTubeUserVarById<string>(userIdOrName, varName, true)
                : CPH.GetYouTubeUserVar<string>(userIdOrName, varName, true);
            if (!string.IsNullOrEmpty(sVal))
                return sVal;
        }
        catch { }

        // 2. Try Int
        try
        {
            int? iVal = byId
                ? CPH.GetYouTubeUserVarById<int?>(userIdOrName, varName, true)
                : CPH.GetYouTubeUserVar<int?>(userIdOrName, varName, true);
            if (iVal.HasValue)
                return iVal.Value;
        }
        catch { }

        // 3. Try Long
        try
        {
            long? lVal = byId
                ? CPH.GetYouTubeUserVarById<long?>(userIdOrName, varName, true)
                : CPH.GetYouTubeUserVar<long?>(userIdOrName, varName, true);
            if (lVal.HasValue)
                return lVal.Value;
        }
        catch { }

        // 4. Try Double
        try
        {
            double? dVal = byId
                ? CPH.GetYouTubeUserVarById<double?>(userIdOrName, varName, true)
                : CPH.GetYouTubeUserVar<double?>(userIdOrName, varName, true);
            if (dVal.HasValue)
                return dVal.Value;
        }
        catch { }

        // 5. Try Object fallback
        try
        {
            object oVal = byId
                ? CPH.GetYouTubeUserVarById<object>(userIdOrName, varName, true)
                : CPH.GetYouTubeUserVar<object>(userIdOrName, varName, true);
            if (oVal != null)
                return oVal;
        }
        catch { }

        return null;
    }

    private object FindUserVarWithAliases(string targetUser, string primaryKey, string[] aliases)
    {
        List<string> keysToTry = new List<string> { primaryKey };
        if (aliases != null)
        {
            foreach (string a in aliases)
            {
                if (!keysToTry.Contains(a))
                    keysToTry.Add(a);
            }
        }

        foreach (string key in keysToTry)
        {
            // Try by Channel ID (UC...) first, then by Username
            object val = SafeGetYouTubeVar(targetUser, key, true)
                      ?? SafeGetYouTubeVar(targetUser, key, false);
            if (val != null)
                return val;
        }

        return null;
    }

    public bool Execute()
    {
        string targetUser = args.ContainsKey("targetUser") ? args["targetUser"].ToString().Trim() : "";
        string requestedVarsCsv = args.ContainsKey("requestedVars")
            ? args["requestedVars"].ToString()
            : "avatarUrl,levelName,months,memberSince,loyaltyLevel";
        string eventName = args.ContainsKey("eventName") ? args["eventName"].ToString() : "MemberWalkOn";

        if (string.IsNullOrEmpty(targetUser))
        {
            CPH.LogWarn("[GTA-Lookup] targetUser was empty.");
            return false;
        }

        var result = new Dictionary<string, object>();
        result["event"] = "GTA_UserLookupResult";
        result["type"] = eventName;
        result["targetUser"] = targetUser;
        result["userName"] = targetUser;

        // Common alias map in case your Streamer.bot variables use slightly different naming conventions
        var aliasMap = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
        {
            { "avatarUrl",    new[] { "userProfileUrl", "avatar", "profileImageUrl", "profilePic", "userAvatar" } },
            { "levelName",    new[] { "tier", "tierName", "memberTier", "membershipTier", "level", "role" } },
            { "months",       new[] { "tenure", "memberMonths", "subscribedMonths", "totalMonths" } },
            { "memberSince",  new[] { "joined", "joinDate", "since", "firstMemberDate", "memberDate" } },
            { "loyaltyLevel", new[] { "loyalty", "rank", "userLevel", "channelLevel", "level" } }
        };

        string[] varNames = requestedVarsCsv.Split(new char[] { ',' }, StringSplitOptions.RemoveEmptyEntries);

        foreach (string rawVar in varNames)
        {
            string varName = rawVar.Trim();
            string[] aliases = aliasMap.ContainsKey(varName) ? aliasMap[varName] : null;

            object val = FindUserVarWithAliases(targetUser, varName, aliases);
            if (val != null)
            {
                result[varName] = val;
                CPH.LogInfo($"[GTA-Lookup] Found {varName} = {val}");
            }
            else
            {
                CPH.LogWarn($"[GTA-Lookup] Variable '{varName}' (and aliases) returned null for {targetUser}.");
            }
        }

        // Also check stored username aliases
        object storedName = FindUserVarWithAliases(targetUser, "userName", new[] { "user", "displayName", "name" });
        if (storedName != null && !string.IsNullOrEmpty(storedName.ToString()))
        {
            result["userName"] = storedName.ToString();
        }

        string jsonPayload = JsonConvert.SerializeObject(result);
        CPH.LogInfo($"[GTA-Lookup] Broadcasting JSON: {jsonPayload}");
        CPH.WebsocketBroadcastJson(jsonPayload);

        return true;
    }
}
