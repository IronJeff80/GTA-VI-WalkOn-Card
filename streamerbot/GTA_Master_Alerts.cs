using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

public class CPHInline
{
    public bool Execute()
    {
        // 1. Identify which trigger fired this action
        string triggerName = args.ContainsKey("triggerName") ? args["triggerName"].ToString() : "Unknown Event";
        bool isTest = args.ContainsKey("isTest") && args["isTest"].ToString().ToLower() == "true";
        string alertType = "generic";

        // Fix old YouTube terminology
        if (triggerName.IndexOf("New Sponsor", StringComparison.OrdinalIgnoreCase) >= 0)
        {
            triggerName = "New Member";
        }

        string tNameLower = triggerName.ToLower();

        // 2. Map YouTube Trigger Names to Overlay Alert Types
        if (tNameLower.Contains("super chat")) alertType = "superchat";
        else if (tNameLower.Contains("super sticker")) alertType = "supersticker";
        else if (tNameLower.Contains("subscriber")) alertType = "sub";
        else if (tNameLower.Contains("milestone")) alertType = "milestone";
        else if (tNameLower.Contains("received")) alertType = "giftRec"; 
        else if (tNameLower.Contains("membership gift") || tNameLower.Contains("gift membership")) alertType = "gift";
        else if (tNameLower.Contains("member") || tNameLower.Contains("sponsor")) alertType = "member";
        else if (tNameLower.Contains("jewel")) alertType = "jewels";

        var payload = new Dictionary<string, object>
        {
            { "event", "GTA_Alert" },
            { "alertType", alertType },
            { "triggerName", triggerName }
        };

        // Standard User Variables (From Trigger Arguments)
        payload["userName"] = args.ContainsKey("user") ? args["user"].ToString() : 
                             (args.ContainsKey("userName") ? args["userName"].ToString() : "YouTube Member");
        
        string userProfileUrl = args.ContainsKey("userProfileUrl") ? args["userProfileUrl"].ToString() : "";
        
        // ALWAYS force valid test image if isTest == true
        if (isTest)
        {
            userProfileUrl = "https://yt3.ggpht.com/XhCX8VaSQAaxcZhSahLCjdB19626R1VNRKKTbCd_PSlepkyqEJYGbybrAbiLHtSDwBN9KN72vYE=s600-c-k-c0x00ffffff-no-rj";
        }
        else if (!string.IsNullOrEmpty(userProfileUrl))
        {
            userProfileUrl = Regex.Replace(userProfileUrl, @"=s\d+-", "=s600-");
        }
        payload["userProfileUrl"] = userProfileUrl;

        // 3. Map Event-Specific Argument Data
        switch (alertType)
        {
            case "member":
                payload["levelName"] = args.ContainsKey("tierName") ? args["tierName"] : "";
                break;
                
            case "milestone":
                payload["levelName"] = args.ContainsKey("tierName") ? args["tierName"] : "";
                payload["months"] = args.ContainsKey("months") ? args["months"] : 1;
                payload["message"] = args.ContainsKey("message") ? args["message"] : "";
                break;
                
            case "gift":
                string countStr = args.ContainsKey("count") ? args["count"].ToString() : "";
                if (string.IsNullOrEmpty(countStr) && args.ContainsKey("amount"))
                {
                    countStr = args["amount"].ToString();
                }
                if (isTest && string.IsNullOrEmpty(countStr)) countStr = "5";
                if (string.IsNullOrEmpty(countStr)) countStr = "1";
                payload["count"] = countStr;
                break;
                
            case "giftRec":
                if (args.ContainsKey("gifterUser") && !string.IsNullOrEmpty(args["gifterUser"].ToString()))
                {
                    payload["gifterUser"] = args["gifterUser"].ToString();
                }
                else if (args.ContainsKey("senderName") && !string.IsNullOrEmpty(args["senderName"].ToString()))
                {
                    payload["gifterUser"] = args["senderName"].ToString();
                }
                else if (args.ContainsKey("sender"))
                {
                    try 
                    {
                        var senderObj = JObject.FromObject(args["sender"]);
                        payload["gifterUser"] = senderObj["name"]?.ToString() ?? "Anonymous";
                    }
                    catch { payload["gifterUser"] = "Anonymous"; }
                }
                else
                {
                    payload["gifterUser"] = isTest ? "Test Gifter" : "Anonymous";
                }
                break;
                
            case "superchat":
                payload["amount"] = args.ContainsKey("amount") ? args["amount"] : "";
                payload["message"] = args.ContainsKey("message") ? args["message"] : "";
                break;
                
            case "supersticker":
                payload["amount"] = args.ContainsKey("amount") ? args["amount"] : "";
                payload["message"] = args.ContainsKey("message") ? args["message"] : "";
                
                string stickerUrl = args.ContainsKey("stickerUrl") ? args["stickerUrl"].ToString() : "";
                if (isTest) 
                {
                    stickerUrl = "https://www.gstatic.com/youtube/img/pdg/gift/assets/loot_box.webp";
                }
                payload["stickerImageUrl"] = stickerUrl;
                break;
                
            case "jewels":
                payload["jewelsAmount"] = args.ContainsKey("gift.jewelsAmount") ? args["gift.jewelsAmount"] : "";
                payload["jewelsName"] = args.ContainsKey("gift.name") ? args["gift.name"] : "";
                
                string jewelsUrl = args.ContainsKey("gift.url") ? args["gift.url"].ToString() : "";
                if (isTest) 
                {
                    jewelsUrl = "https://www.gstatic.com/youtube/img/pdg/gift/assets/controller.webp";
                }
                payload["jewelsUrl"] = jewelsUrl;
                break;
        }

        // 4. Broadcast JSON via WebSockets
        string jsonPayload = JsonConvert.SerializeObject(payload);
        CPH.LogInfo($"[GTA-Alert] Broadcasting: {jsonPayload}");
        CPH.WebsocketBroadcastJson(jsonPayload);

        return true;
    }
}
