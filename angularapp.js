var app = angular.module("myApp", ['luegg.directives']);
app.service("chatService", function($http, $q){
    this.sendMessage = function(message, messageLength){
        data={message: message, messageLength: messageLength};
        var deferred = $q.defer();
        $http.post("/counsel/sendMessage", data).then(function(response){
            deferred.resolve(response);
        });
        return deferred.promise;
    };
    this.getMessages = function(){
        var deferred = $q.defer();
        $http.post("/counsel/getMessages").then(function(response){
            deferred.resolve(response.data.res);
        });
        return deferred.promise;
    };   
});

app.service("loginService", function($http, $q){
    this.login = function(username, password){
        data={username: username, password: password};
        var deferred = $q.defer();
        $http.post("/login/login", data).then(function(response){
            deferred.resolve(response.data);
        });
        return deferred.promise;
    }
    this.logout= function(){
        $http.post("/login/logout").then(function(response){
            window.location.href="/login";
        });
    }
});

app.service("adminService", function($http, $q){
    this.retrieveMessages = function(){
        var deferred = $q.defer();
        $http.post("/admin/retrieveMessages").then(function(response){
            deferred.resolve(response.data.res);

        });
        return deferred.promise;
    }
    this.sendMessage = function(chatId, message, messageLength){
        var deferred = $q.defer();
        var data = {chatId: chatId, message: message, messageLength: messageLength};
        $http.post("/admin/sendMessage", data).then(function(response){
            deferred.resolve(response);
        });
        return deferred.promise;
    }
});

app.controller("chatroom", function($scope, chatService, $timeout){
    function makeid(j){
        {
            var text = "";
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

            for( var i=0; i < j; i++ ){
                text += possible.charAt(Math.floor(Math.random() * possible.length));
            }

            return text;
        }
    };


    $scope.sendMessage= function(){
        console.log("Submitted");
        var encryptionKey = makeid(30);
        var addedKey= makeid(5);
        var encryptedMessage = GibberishAES.enc($scope.message, encryptionKey);
        var messageLength = GibberishAES.enc(encryptedMessage.length, addedKey);
        if($scope.message){
            chatService.sendMessage(addedKey+encryptedMessage+encryptionKey, messageLength).then(function(response){
                $scope.message="";
            });
        }
        
    };

    $scope.getMessages = function(){
        chatService.getMessages().then(function(response){
            $scope.messages=response;
            console.log(response);
        });
        $timeout( function(){
            $scope.getMessages();
        }, 1000);
    };
    $scope.getMessages();

    $scope.decrypt = function(encText, decKey){
        return GibberishAES.dec(encText, decKey);

    }
    
});

app.controller("loginController", function($scope, loginService){
    $scope.login = function(){   
        loginService.login($scope.username, $scope.password).then(function(response){
            if(response.err ==1){
                console.log("LOGIN ERROR");
                $scope.failed= true;
                $scope.successful = false;
                $scope.$apply();
            }
            else{
                console.log("LOGIN SUCCESSFUL");
                $scope.successful= true;
                $scope.failed= false;
                setTimeout(function(){window.location.href="/login";},1000);   
            }
        });
    };
    $scope.logout = function(){
        loginService.logout();
    }
});

app.controller("adminController", function($scope, adminService, $timeout){
    function makeid(j){
        {
            var text = "";
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

            for( var i=0; i < j; i++ ){
                text += possible.charAt(Math.floor(Math.random() * possible.length));
            }

            return text;
        }
    };
    $scope.scrollBottom= false;
    $scope.getMessages = function(){
        adminService.retrieveMessages().then(function(response){
            $scope.messages = response;
            if($scope.openedMessage){
                for(var i =0; i<$scope.messages.length; i++){
                    if($scope.messages[i][0].chat_id == $scope.openedMessage[0].chat_id){
                        $scope.openedMessage = $scope.messages[i];
                    }
                }
            }
        });

        $timeout(function(){
            $scope.getMessages();
        }, 1000)
    };
    $scope.getMessages();

    $scope.decrypt = function(encText, decKey){
        return GibberishAES.dec(encText, decKey);
    }
    $scope.openMessage = function(messages){
        $scope.openedMessage = messages;
    }
    $scope.sendMessage = function(){
        if($scope.openedMessage && $scope.adminMessage){
            var encryptionKey = makeid(30);
            var addedKey= makeid(5);
            var encryptedMessage = GibberishAES.enc($scope.adminMessage, encryptionKey);
            var messageLength = GibberishAES.enc(encryptedMessage.length, addedKey);
            adminService.sendMessage($scope.openedMessage[0].chat_id, addedKey+encryptedMessage+encryptionKey, messageLength).then(function(response){
                $scope.adminMessage="";
                $scope.scrollBottom=true;
                setTimeout(function(){
                    $scope.scrollBottom=false;
                }, 1000)
                
                
            });
        }
    }
});


