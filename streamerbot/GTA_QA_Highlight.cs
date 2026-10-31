using System;
using System.Text.RegularExpressions;
using Newtonsoft.Json;

public class CPHInline
{
    public bool Execute()
    {
        // 1. Grab user & message from Quick Action / Chat Message Trigger / Command
        string user = args.ContainsKey("userName") ? args["userName"].ToString()
                    : (args.ContainsKey("user") ? args["user"].ToString()
                    : (args.ContainsKey("targetUser") ? args["targetUser"].ToString() : "Viewer"));

        string msg = args.ContainsKey("message") ? args["message"].ToString()
                   : (args.ContainsKey("rawInput") ? args["rawInput"].ToString() : "");

        if (string.IsNullOrWhiteSpace(msg))
        {
            CPH.LogWarn("[GTA-QA] Message was empty, skipping highlight.");
            return false;
        }

        // 2. Resolve Avatar URL from Trigger Args or User Persisted Variables
        string avatar = "";
        if (args.ContainsKey("profileImageUrl") && !string.IsNullOrEmpty(args["profileImageUrl"].ToString()))
            avatar = args["profileImageUrl"].ToString();
        else if (args.ContainsKey("userProfileUrl") && !string.IsNullOrEmpty(args["userProfileUrl"].ToString()))
            avatar = args["userProfileUrl"].ToString();
        else if (args.ContainsKey("avatarUrl") && !string.IsNullOrEmpty(args["avatarUrl"].ToString()))
            avatar = args["avatarUrl"].ToString();

        if (string.IsNullOrEmpty(avatar))
        {
            string userId = args.ContainsKey("userId") ? args["userId"].ToString() : "";
            if (!string.IsNullOrEmpty(userId))
            {
                avatar = CPH.GetYouTubeUserVarById<string>(userId, "avatarUrl", true)
                      ?? CPH.GetYouTubeUserVarById<string>(userId, "userProfileUrl", true);
            }
            if (string.IsNullOrEmpty(avatar))
            {
                avatar = CPH.GetYouTubeUserVar<string>(user, "avatarUrl", true)
                      ?? CPH.GetYouTubeUserVar<string>(user, "userProfileUrl", true);
            }
        }

        // Upscale YouTube avatar to 600px
        if (!string.IsNullOrEmpty(avatar))
        {
            avatar = Regex.Replace(avatar, @"=s\d+-", "=s600-");
        }

        var qaData = new
        {
            @event = "GTA_QA",
            user = user.ToUpper(),
            msg = msg,
            avatar = avatar ?? "",
            timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
        };

        string jsonOutput = JsonConvert.SerializeObject(qaData);

        // Update Global Variable ('viChatHighlight') AND Broadcast via WebSocket
        CPH.SetGlobalVar("viChatHighlight", jsonOutput, true);
        CPH.WebsocketBroadcastJson(jsonOutput);
        CPH.LogInfo($"[GTA-QA] Highlighted message from {user}: {jsonOutput}");

        return true;
    }
}
