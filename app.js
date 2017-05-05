var express= require("express");
var bodyParser = require("body-parser");
var session = require("express-session")
var app = express();
var mysql = require("mysql");
var giberrish = require("gibberish-aes/dist/gibberish-aes-1.0.0.js");
var connection = mysql.createConnection({
    host: process.env.MYSQL_HOST||"127.0.0.1",
    user: process.env.MYSQL_USER||"root",
    password: process.env.MYSQL_PASSWORD||"",
    database: process.env.MYSQL_DB||"asp",
    port: process.env.MYSQL_PORT ||"3306"
});

//essentials
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use("/", express.static("./"));
app.use("/", express.static("./node_modules"));
app.use("/", express.static("./simple-scrollbar-master"));
app.use("/scrollbar", express.static("./malihu-custom-scrollbar-plugin-master"));
app.use(session({secret:"wriwoewewssm2wersa39903"}));
//routers
var chatRouter = express.Router();
var loginRouter = express.Router();
var adminRouter = express.Router();
app.use("/counsel", chatRouter);
app.use("/login", loginRouter);
app.use("/admin", adminRouter);

chatRouter.get("/", function(req, res){
    var chatId = req.query.chatid;
    if(!(req.session.chatId)){
        var password = "";
        connection.query("INSERT INTO chat_info SET password = ?", [password], function(err, res1){
            if(err){
                console.log("AN ERROR OCCURED "+err.stack);
                res.sendfile("./error.html")
            }
            else{
                req.session.chatId=res1.insertId;
                console.log(res1.insertId);
                res.sendfile("./chat.html");
            }
        });
    }
    else{
        res.sendfile("./chat.html")
    }
    
});

chatRouter.post("/sendMessage", function(req, res){
    var message= req.body.message;
    var chatId = req.session.chatId;
    var messageLength = req.body.messageLength;
    var messageLengthDecryptionKey= message.substring(0,5);
    var messageLength= giberrish.dec(req.body.messageLength, messageLengthDecryptionKey); 
    var receivedText = message.substring(5, parseInt(messageLength)+5);
    var encryptionKey = message.substring(parseInt(messageLength)+5);
    var decryptedMessage = giberrish.dec(receivedText, encryptionKey);  
    console.log(decryptedMessage);
    var data = {
        err: 1,
        res: "",
        chatId: ""
    };
    connection.query("INSERT INTO messages SET message_content = ?, user_sent_by = ?, chat_id =?, message_security_key=?",[receivedText, "client", chatId, encryptionKey], function(err, res1){
        if(err){
            data.res="Error inserting message "+err;
            console.log(err);
            res.json(data);
        }
        else{
            data.err=0;
            data.res="Successful";
            data.chatId= chatId;
            res.json(data);
        }
        
    });
});

chatRouter.post("/getMessages", function(req, res){
    var chatId = req.session.chatId;
    console.log("MESSAGE FETCHED");
    var data = {
        err: 1,
        res: ""
    }
    connection.query("SELECT * FROM messages WHERE chat_id=?", [chatId], function(err, res1, rows){
        if(err){
            data.res="ERROR ";
            console.log(err);
            res.json(data);
            
        }
        else{
            data.res= res1;
            console.log(data);
            res.json(data);            
        }
    });
});

loginRouter.get("/", function(req, res){
    if(req.session.adminId){
        res.sendfile("./admin_home.html");
    }
    else{
        res.sendfile("./login.html");
    }
});

loginRouter.post("/login", function(req, res){
    var username = req.body.username || "";
    var password = req.body.password || "";
    var data= {
        err:1,
        res:""
    };
    connection.query("SELECT * FROM admins WHERE admin_username=? AND admin_password=?", [username, password], function(err, res1, rows){
        if(err){
            data.res="Problem logging in";
            console.log(err);
            res.json(data);
        }
        else{
            if(res1[0]){
                console.log(res1);
                req.session.adminUsername= res1[0].admin_username;
                req.session.adminId = res1[0].admin_id;
                req.session.adminPool = res1[0].admin_pool;
                data.err=0;
                data.res="Login Successful";
                res.json(data);
            }
            else{
                data.res="Incorrect Username/ Password";
                res.json(data);

            }
        }
    });
});

loginRouter.post("/logout", function(req, res){
    req.session.adminUsername = null;
    req.session.adminId= null;
    req.session.adminPool = null;
    res.send();
});
adminRouter.get("/home", function(req, res){
    if(req.session.adminId){
        res.sendfile("./admin.html");
    }
    else{
        res.redirect("/login");
    }
});
adminRouter.post("/retrieveMessages", function(req, res){
    if(req.session.adminId){
        var adminPool = req.session.adminPool;
        data={
            err:1,
            res:""
        }
        connection.query("SELECT * FROM messages WHERE pool=? ORDER BY message_id DESC", [adminPool], function(err, res1, rows){
            if(err){
                data.res=[];
                res.json(data);
            }
            else{
                data.err=0;
                var chatIds =[];
                var processCompleted=0;
                for(var i = 0; i<res1.length; i++){
                    if(chatIds.indexOf(res1[i].chat_id) == -1){
                        chatIds.push(res1[i].chat_id);
                    }
                    if(i == res1.length-1){
                        processCompleted=1;
                    }
                }

                var mappingProcessCompleted=0;
                var outerArray =[];
                function mapMessages(earlierProcessCompleted){
                    if(earlierProcessCompleted==1){
                        console.log(chatIds);
                        
                        for(var i=0; i<chatIds.length; i++){
                            var innerArray =[];
                            for(var j =0; j<res1.length; j++){
                                if(chatIds[i] == res1[j].chat_id){
                                    innerArray.push(res1[j]);
                                }
                                if(j == res1.length-1){
                                    outerArray.push(innerArray);
                                }
                            }
                            if(i == chatIds.length-1){
                                console.log(outerArray);
                                mappingProcessCompleted=1;
                            }
                        }
                        
                    }
                }
                mapMessages(processCompleted);
                function returnMappedMessages(earlierProcessCompleted){
                    if(earlierProcessCompleted==1){
                        console.log(outerArray);
                        data.res = outerArray; 
                    }
                }
                returnMappedMessages(mappingProcessCompleted);
                             
                res.json(data);
                
            }
        });
    }
    else{
        res.redirect("/login");
    }
});

adminRouter.post("/sendMessage", function(req, res){
    var message= req.body.message;
    var messageLength = req.body.messageLength;
    var chatId = req.body.chatId;
    var messageLengthDecryptionKey= message.substring(0,5);
    var messageLength= giberrish.dec(req.body.messageLength, messageLengthDecryptionKey); 
    var receivedText = message.substring(5, parseInt(messageLength)+5);
    var encryptionKey = message.substring(parseInt(messageLength)+5);
    var decryptedMessage = giberrish.dec(receivedText, encryptionKey);  
    console.log(decryptedMessage);
    var data = {
        err: 1,
        res: "",
        chatId: ""
    };
    connection.query("INSERT INTO messages SET message_content = ?, user_sent_by = ?, chat_id =?, message_security_key=?",[receivedText, "audiri", chatId, encryptionKey], function(err, res1){
        if(err){
            data.res="Error inserting message "+err;
            console.log(err);
            res.json(data);
        }
        else{
            data.err=0;
            data.res="Successful";
            data.chatId= chatId;
            res.json(data);
        }
        
    });

});

app.listen(process.env.PORT||3000);