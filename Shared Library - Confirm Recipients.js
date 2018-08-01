/**
 * To use this, replace trigger.recipients = recipients; with:
 * 
 * var mySharedLibrary = require('Confirm Recipients');
 * trigger.recipients = mySharedLibrary.getRecipients(payload.users);
 * 
 * 
 **/
 
 exports.getRecipients = function(users) {
    var recipients = [];

    for (var i in users)
    {
        var oncallCount = 0;
    
        var userId = users[i].userId;
        
        var request = http.request({ 
             "endpoint": "xMatters",
             "path": "/api/xm/1/groups/" + userId + "/members?embed=shifts",
             "method": "GET"
        });
         
        var response = request.write();
        GROUPjson = JSON.parse(response.body);
                            
        if (response.statusCode == 200 ) {     //check whether it's a group
            console.log("It's a group");
            
           var ONCALLrequest = http.request({ 
                    "endpoint": "xMatters",
                    "path": "/api/xm/1/on-call?groups=" + encodeURI( userId) ,//+ "&embed=shift,members.owner&membersPerShift=100",
                    "method": "GET"
                });
                
                var ONCALLresponse = ONCALLrequest.write();
                ONCALLjson = JSON.parse(ONCALLresponse.body);
                
                console.log("\n\n---GROUP:"+userId+"---\n\n");
                
                if (typeof(ONCALLjson.data[0].members) === 'undefined') {
                    
                    console.log("GROUP:"+userId+" doesn't have any active shifts right now");
                    
                    //add everyone in the group to recipients
                    for (var k in GROUPjson.data) { 
                        recipients.push({'id': GROUPjson.data[k].member.targetName});
                    }
    
                    console.log("Added all "+GROUPjson.data.length+" users to recipients");
                    
                } else {
                    //console.log(JSON.stringify(ONCALLjson, null, 2));
    
                    for (var e in ONCALLjson.data) {    
                        
                        if (ONCALLjson.data[e].members.count === 0){
                            console.log("GROUP:"+userId+" / SHIFT:"+ONCALLjson.data[e].shift.name+" doesn't have any active members right now");
                        } else {
                            console.log("GROUP:"+userId+" / SHIFT:"+ONCALLjson.data[e].shift.name+" has "+ONCALLjson.data[e].members.count+" active members right now");
                            oncallCount = oncallCount + ONCALLjson.data[e].members.count;
                        }
    
                    }
                    
                    console.log("GROUP:"+userId+" has " + oncallCount + " total oncall right now");
                    
                    if (oncallCount>0){
                        //add the group to recipients and follow normal on-call shift
                        recipients.push({'id': userId});
                    } else {
                        //add everyone in the group to recipients
                        for (var j in GROUPjson.data) { 
                            recipients.push({'id': GROUPjson.data[j].member.targetName});
                        }
                        console.log("Added all "+GROUPjson.data.length+" users to recipients");
                    }
                }
                
                console.log("\n\n---\n\n");
            
            } else {
                console.log("It's a person");
                //add the person to recipients
                recipients.push({'id': userId}); 
            }
    }
    
    return recipients;

};