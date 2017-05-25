var app = angular.module("myApp", ['luegg.directives']);
app.service("chatService", function($http, $q) {
    this.sendMessage = function(message, messageLength) {
        data = { message: message, messageLength: messageLength };
        var deferred = $q.defer();
        $http.post("/counsel/sendMessage", data).then(function(response) {
            deferred.resolve(response);
        });
        return deferred.promise;
    };
    this.getMessages = function() {
        var deferred = $q.defer();
        $http.post("/counsel/getMessages").then(function(response) {
            deferred.resolve(response.data.res);
        });
        return deferred.promise;
    };
});

app.service("loginService", function($http, $q) {
    this.login = function(username, password) {
        data = { username: username, password: password };
        var deferred = $q.defer();
        $http.post("/login/login", data).then(function(response) {
            deferred.resolve(response.data);
        });
        return deferred.promise;
    }
    this.logout = function() {
        $http.post("/login/logout").then(function(response) {
            window.location.href = "/login";
        });
    }
});

app.service("adminService", function($http, $q) {
    this.retrieveMessages = function() {
        var deferred = $q.defer();
        $http.post("/admin/retrieveMessages").then(function(response) {
            deferred.resolve(response.data);

        });
        return deferred.promise;
    }
    this.sendMessage = function(chatId, message, messageLength) {
        var deferred = $q.defer();
        var data = { chatId: chatId, message: message, messageLength: messageLength };
        $http.post("/admin/sendMessage", data).then(function(response) {
            deferred.resolve(response);
        });
        return deferred.promise;
    }
    this.openMesage = function(x) {
        var deferred = $q.defer();
        var data = {
            chatId: x
        }
        $http.post("/admin/openMessage", data).then(function(response) {
            deferred.resolve(response);
        });
        return deferred.promise;
    };

    this.highlight = function(query, text) {
        if (query) {
            if (query.length > 1) {
                var splitQuery = query.split(" ");
                for (var i = 0; i < splitQuery.length; i++) {
                    var stringPosition = text.search(new RegExp("(" + splitQuery[i] + "(?!>))", "gi"));
                    var originalText = text.substr(stringPosition, splitQuery[i].length);
                    var text = text.replace(new RegExp("(" + splitQuery[i] + "(?!>))", "i"), "<b>" + originalText + "</b>");
                    console.log(splitQuery[i]);
                }
                return text;
            } else {
                var stringPosition = text.search(new RegExp("(" + query + ")", "gi"));
                var originalText = text.substr(stringPosition, query.length);
                var text = text.replace(new RegExp("(" + query + ")", "i"), "<b>" + originalText + "</b>");
                console.log(text);
                return text;
            }
        } else {
            return text;
        }
    };
});

app.service("chatFeedbackService", function($http, $q) {
    this.sendFeedback = function(rating, comment) {
        var deferred = $q.defer();
        var data = { rating: rating, comment: comment };
        $http.post("/feedback/chatFeedback", data).then(function(response) {
            deferred.resolve(response);
        });
        return deferred.promise;
    }
});

app.controller("chatroom", function($scope, chatService, $timeout) {
    function makeid(j) {
        {
            var text = "";
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

            for (var i = 0; i < j; i++) {
                text += possible.charAt(Math.floor(Math.random() * possible.length));
            }

            return text;
        }
    };


    $scope.sendMessage = function() {
        console.log("Submitted");
        var encryptionKey = makeid(30);
        var addedKey = makeid(5);
        var encryptedMessage = GibberishAES.enc($scope.message, encryptionKey);
        var messageLength = GibberishAES.enc(encryptedMessage.length, addedKey);
        if ($scope.message) {
            chatService.sendMessage(addedKey + encryptedMessage + encryptionKey, messageLength).then(function(response) {
                $scope.message = "";
            });
        }

    };

    $scope.getMessages = function() {
        chatService.getMessages().then(function(response) {
            $scope.messages = response;
            console.log(response);
        });
        $timeout(function() {
            $scope.getMessages();
        }, 1000);
    };
    $scope.getMessages();

    $scope.decrypt = function(encText, decKey) {
        return GibberishAES.dec(encText, decKey);

    }

});

app.controller("loginController", function($scope, loginService) {
    $scope.login = function() {
        loginService.login($scope.username, $scope.password).then(function(response) {
            if (response.err == 1) {
                console.log("LOGIN ERROR");
                $scope.failed = true;
                $scope.successful = false;
                $scope.$apply();
            } else {
                console.log("LOGIN SUCCESSFUL");
                $scope.successful = true;
                $scope.failed = false;
                setTimeout(function() { window.location.href = "/login"; }, 1000);
            }
        });
    };
    $scope.logout = function() {
        loginService.logout();
    }
});

app.controller("adminController", function($scope, adminService, $timeout) {
    function makeid(j) {
        {
            var text = "";
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

            for (var i = 0; i < j; i++) {
                text += possible.charAt(Math.floor(Math.random() * possible.length));
            }

            return text;
        }
    };

    function filterMessages(messages, adminId) {
        var completedLoop = 0;
        for (var i = 0; i < messages.length; i++) {
            for (var j = 0; j < messages[i].length; j++) {
                var adminsRead = JSON.parse(messages[i][j].admins_opened_by);
                if (adminsRead.indexOf(adminId) == -1 && messages[i][j].user_sent_by == "client") {
                    messages[i][j].alert = "alert";
                    if (messages[i].count) {
                        messages[i].count += 1;
                    } else {
                        messages[i].count = 1;
                    }
                } else {
                    messages[i][j].alert = "noalert";
                }

                if (i == (messages.length - 1)) {
                    completedLoop = 1;
                }
            }
        }

        if (completedLoop == 1) {
            return messages;
        }
    }

    $scope.scrollBottom = false;
    $scope.getMessages = function() {
        adminService.retrieveMessages().then(function(response) {
            $scope.messages = filterMessages(response.res, response.adminId);
            console.log($scope.messages);
            $scope.adminId = response.adminId;
            if ($scope.openedMessage) {
                for (var i = 0; i < $scope.messages.length; i++) {
                    if ($scope.messages[i][0].chat_id == $scope.openedMessage[0].chat_id) {
                        $scope.openedMessage = $scope.messages[i];
                    }
                }
            }
        });
        $timeout(function() {
            $scope.getMessages();
        }, 2000)
    };

    $scope.getMessages();

    $scope.decrypt = function(encText, decKey) {
        return GibberishAES.dec(encText, decKey);
    }
    $scope.openMessage = function(messages) {
        $scope.openedMessage = messages;
        adminService.openMesage(messages[0].chat_id);
    }
    $scope.sendMessage = function() {
        if ($scope.openedMessage && $scope.adminMessage) {
            var encryptionKey = makeid(30);
            var addedKey = makeid(5);
            var encryptedMessage = GibberishAES.enc($scope.adminMessage, encryptionKey);
            var messageLength = GibberishAES.enc(encryptedMessage.length, addedKey);
            adminService.sendMessage($scope.openedMessage[0].chat_id, addedKey + encryptedMessage + encryptionKey, messageLength).then(function(response) {
                $scope.adminMessage = "";
                $scope.scrollBottom = true;
                setTimeout(function() {
                    $scope.scrollBottom = false;
                }, 1000)


            });
        }
    }

    $scope.fixName = function(id, name) {
        if (id == $scope.adminId) {
            return "You";
        } else {
            return name;
        }
    }
});

app.controller("feedbackController", function($scope, chatFeedbackService) {
    $scope.starClick = function(id) {
        if ($scope.selectedId == id) {
            $scope.star = ["", "", "", "", ""];
            $scope.selectedId = 0;
        } else {
            $scope.star = ["", "", "", "", ""];
            $scope.selectedId = id;
            for (var i = 0; i < id; i++) {
                $scope.star[i + 1] = "rgb(193,172,81)";
                console.log($scope.star[i + 1]);
            }
        }
    }
    $scope.sendFeedback = function() {
        if ($scope.selectedId) {
            chatFeedbackService.sendFeedback($scope.selectedId, $scope.comment).then(function(response) {
                $scope.alert = false;
                window.location = "/counsel";
            });
        } else {
            $scope.alert = true;
        }
    }
});