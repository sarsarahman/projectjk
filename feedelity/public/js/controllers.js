'use strict';

var buttonTypes = [BootstrapDialog.TYPE_DEFAULT, BootstrapDialog.TYPE_INFO, BootstrapDialog.TYPE_PRIMARY,
                BootstrapDialog.TYPE_SUCCESS, BootstrapDialog.TYPE_WARNING, BootstrapDialog.TYPE_DANGER];

var getPath = function(href) {
    var nasr = document.createElement("a");
    nasr.href = href;
    return nasr;
};

/* Controllers */

function FeedelityCtrl($scope, $http, Upload) {


    $scope.feeds = [];
    $scope.tags = [];
    $scope.categorys = [];
    $scope.locations = [];
    $scope.trimmedTags = [];
    $scope.trimmedLocations = [];
    $scope.trimmedCategorys = [];

    $scope.articles = [];

    $scope.logout = function() {
        window.location.href = "/logout";
    }


    $http({
        method: 'GET',
        url: '/api/feeds'
    }).
    success(function(data, status, headers, config) {
        $scope.feeds = data;
    }).
    error(function(data, status, headers, config) {
        $scope.feeds = []
    });

    $http({
        method: 'GET',
        url: '/api/counts'
    }).
    success(function(data, status, headers, config) {
        $scope.articlesCount = data;
    }).
    error(function(data, status, headers, config) {
        console.log('articles count err:', data);
        $scope.articlesCount = []
    });


    $scope.categoryDropDown = {};
    $scope.locationDropDown = {};
    $http({
        method: 'GET',
        url: '/api/categorys'
    }).
    success(function(data, status, headers, config) {
        $scope.categorys = data;

        $scope.trimmedCategorys = $scope.categorys.map(function(obj) {
            return {
                _id: obj._id,
                name: obj.name
            };
        });
    }).
    error(function(data, status, headers, config) {
        $scope.categorys = []
    });

    $http({
        method: 'GET',
        url: '/api/tags'
    }).
    success(function(data, status, headers, config) {
        $scope.tags = data;
        $scope.trimmedTags = $scope.tags.map(function(obj) {
            return {
                _id: obj._id,
                name: obj.name
            };
        });
    }).
    error(function(data, status, headers, config) {
        $scope.tags = []
    });

    $http({
        method: 'GET',
        url: '/api/locations'
    }).
    success(function(data, status, headers, config) {
        $scope.locations = data;

        $scope.trimmedLocations = $scope.locations.map(function(obj) {
            return {
                _id: obj._id,
                name: obj.name
            };
        });
    }).
    error(function(data, status, headers, config) {
        $scope.locations = []
    });


    // ^Fetch Feeds
    $scope.refresh = function() {
        $http({
            method: 'GET',
            url: '/api/refresh'
        }).
        success(function(data, status, headers, config) {
            $scope.feeds = data[0];
            $scope.articlesCount = data[1];
            var msgfeedsFetched = BootstrapDialog.show({
                type: buttonTypes[3],
                message: "Feed(s) fetched successfully."
            });
            setTimeout(function() {
                msgfeedsFetched.close();
            }, 2000);
            $scope.$broadcast('feedsRefreshed');
        });
    }
    // $Fetch Feeds

    $scope.upload = function(files) {
        if (files && files.length) {
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                Upload.upload({
                    url: '/api/images',
                    fields: {
                        'username': $scope.username
                    },
                    file: file
                }).progress(function(evt) {
                    var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                    console.log('progress: ' + progressPercentage + '% ' + evt.config.file.name);
                }).success(function(data, status, headers, config) {
                    returnValue = JSON.stringify(data.path);
                    // console.log(config);
                    // console.log('file ' + config.file.name + 'uploaded. Response: ' + JSON.stringify(data));
                });
            }
        }
    };

    $scope.$on('Approve', function (event, data) {
        $scope.articlesCount.pendingArticlesCount -= data;
        $scope.articlesCount.approvedArticlesCount += data;
    });

    $scope.$on('disApprove', function (event, data) {
        $scope.articlesCount.pendingArticlesCount += data;
        $scope.articlesCount.approvedArticlesCount -= data;
    });

    $scope.$on('star', function (event, data) {
        data ? $scope.articlesCount.starredArticlesCount += 1 : 
        $scope.articlesCount.starredArticlesCount -= 1;
    });

}

function ArticlesCtrl($scope, $http, $route, Upload, $timeout) {

    $scope.page = 0;

    $scope.dateOptions = {
        startingDay: 1,
        showWeeks: false
    };

    $scope.editArticle = {};
    $scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
    $scope.format = $scope.formats[0];
    $scope.type = $route.current.type;
    console.log($scope.type)
    
    function getAllArticles() {
        var articlesUrl = '/api/articles/' + $scope.type + '/' + $scope.page;
        $http({
            method: 'GET',
            url: articlesUrl
        }).
        success(function(data, status, headers, config) {
            console.log('get all articles:', data.length);
            $scope.articles = data;
        }).
        error(function(data, status, headers, config) {
            $scope.articles = []
        });
    }

    getAllArticles();

    $scope.fetchArticles = function(direction) {

        var paginate = false;

        if (direction == 'previous' && $scope.page != 0) {
            $scope.page--;
            paginate = true;
        } else if (direction == 'next') {
            $scope.page++;
            paginate = true;
        };

        if (paginate) {

            var articlesUrl = '/api/articles/' + $scope.type + '/' + $scope.page;
            $http({
                method: 'GET',
                url: articlesUrl
            }).
            success(function(data, status, headers, config) {
                $scope.articles = data;
                console.log(data);
            }).
            error(function(data, status, headers, config) {
                $scope.articles = []
            });

        };
    }

    // $scope.$on('feedsRefreshed', function() {
    //     var articlesUrl = '/api/articles/' + $scope.type;
    //     $http({
    //         method: 'GET',
    //         url: articlesUrl
    //     }).
    //     success(function(data, status, headers, config) {
    //         console.log('feedsRefreshed');
    //         $scope.articles = data;
    //     }).
    //     error(function(data, status, headers, config) {
    //         $scope.articles = []
    //     });
    // });

    $scope.$on('feedsRefreshed', function() {
        var articlesUrl = '/api/articles/' + $scope.type;
        $http({
            method: 'GET',
            url: articlesUrl
        }).
        success(function(data, status, headers, config) {
            console.log('feedsRefreshed');
            $scope.articles = data;
        }).
        error(function(data, status, headers, config) {
            $scope.articles = []
        });
    });

    $scope.delete = function(id) {
        if(loggedinUser.delArticles) {
            var delArticle = $scope.articles[id];
            BootstrapDialog.confirm({
                title : 'Delete Article',
                type : buttonTypes[5],
                message : 'Are you sure to delete?',
                btnOKLabel : 'Delete',
                callback : function(yes) {
                    if(yes) {
                        $http({
                            method: 'DELETE',
                            url: '/api/articles/' + delArticle._id
                        }).
                        success(function(data, status, headers, config) {
                            // $scope.articles[id] = data;
                            $scope.articles.splice(id, 1);
                            var msgarticleDeleted = BootstrapDialog.show({
                                type: buttonTypes[3],
                                message: 'Article deleted successfully.'
                            });
                            setTimeout(function() {
                                msgarticleDeleted.close();
                            }, 2000);
                        });
                    }
                }
            });
        } else {
            var msgdelArticles = BootstrapDialog.show({
                type : buttonTypes[5],
                message : "You doesn't have rights to perform this action."
            });
            setTimeout(function() {
                msgdelArticles.close();
            }, 2000);
        }
    }

    $scope.add = function() {
        if(loggedinUser.addArticles) {
            $http({
                method: 'POST',
                data: $scope.addArticle,
                url: '/api/articles'
            }).
            success(function(data, status, headers, config) {
                $scope.articles.push(data);
                console.log($scope.addArticle)
                $('#modAddArticle').modal('hide');
                $scope.addArticle = {};
                var msgarticleAdded = BootstrapDialog.show({
                    type : buttonTypes[3],
                    message : 'Article added successfully.'
                });
                setTimeout(function() {
                    msgarticleAdded.close();
                }, 2000);
            });
        } else {
            var msgaddArticles = BootstrapDialog.show({
                type : buttonTypes[5],
                message : "You doesn't have rights to perform this action."
            });
            setTimeout(function() {
                msgaddArticles.close();
            }, 2000);
        }
    }

    $scope.dispUpdate = function(id) {
        var editArticle = $scope.articles[id];
        $scope.editArticleId = id;
        $http({
            method: 'GET',
            url: '/api/articles/' + editArticle._id
        }).
        success(function(data, status, headers, config) {
            $scope.editArticle = data;
            //if no imgUrl means, get image from the article source, else get imgUrl.
            !$scope.editArticle.imgUrl ? $scope.editArticle.imgUrl = $($scope.editArticle.summary).find('img').attr('src') : '';
        }).
        error(function(data, status, headers, config) {
            $scope.editArticle = {}
        });
    }

    $scope.updateArticle = function() {
        if(loggedinUser.updateArticles) {
            $http({
                method: 'POST',
                data: $scope.editArticle,
                url: '/api/articles/' + $scope.editArticle._id
            }).
            success(function(data, status, headers, config) {
                console.log('test');
                $scope.articles[$scope.editArticle._id] = data;
                $scope.editArticle = {};
                $('#modArticle').modal('hide');
                var msgarticleUpdated = BootstrapDialog.show({
                    type : buttonTypes[3],
                    message : 'Article updated successfully.'
                });
                setTimeout(function() {
                    msgarticleUpdated.close();
                }, 2000);
            });
        } else {
            var msgupdateArticles = BootstrapDialog.show({
                type : buttonTypes[5],
                message : "You doesn't have rights to perform this action."
            });
            setTimeout(function() {
                msgupdateArticles.close();
            }, 2000);
        }
    }

    $scope.updateArticleQuickEdit = function() {
        if(loggedinUser.updateArticles) {
            $http({
                method: 'POST',
                data: $scope.editArticle,
                url: '/api/articles/' + $scope.editArticle._id
            }).
            success(function(data, status, headers, config) {
                $scope.articles[$scope.editArticle._id] = data;
                $(".collapse").collapse("hide")
                $scope.editArticle = {};
                var msgarticleUpdated = BootstrapDialog.show({
                    type : buttonTypes[3],
                    message : 'Article updated successfully.'
                });
                setTimeout(function() {
                    msgarticleUpdated.close();
                }, 2000);
            });
        } else {
            var msgupdateArticles = BootstrapDialog.show({
                type : buttonTypes[5],
                message : "You doesn't have rights to perform this action."
            });
            setTimeout(function() {
                msgupdateArticles.close();
            }, 2000);
        }
    }

    // ^Checkbox
    $scope.multipleArticles = [];
    $scope.chkValue = false;
    $scope.multipleApprove = function(id, chkValue) {
        chkValue ? $scope.multipleArticles.push($scope.articles[id]) : 
        $scope.multipleArticles.splice($scope.multipleArticles.indexOf($scope.articles[id]), 1);
    }
    // $Checkbox

    // ^Bulk Edit
    $scope.openBulkEditModal = function(selector) {
        if($scope.multipleArticles.length === 0) {
            var msgarticleApproved = BootstrapDialog.show({
                type : buttonTypes[4],
                message : 'No Article(s) Selected.'
            });
            setTimeout(function() {
                msgarticleApproved.close();
            }, 2000);
        } else {
            $(selector).modal();
            $scope.bulkeditArticle = {};
        }
    }

    // $scope.dispbulkUpdate = function() {
    //     $scope.bulkeditArticle = {};
    // }

    $scope.bulkEditArticle = function() {
        if(loggedinUser.updateArticles) {
            $scope.bulkUpdate = [];
            $scope.multipleArticles.forEach(function(article, id) {
                article.category = article.category.concat($scope.bulkeditArticle.category);
                article.location = article.location.concat($scope.bulkeditArticle.location);
                article.tags = article.tags.concat($scope.bulkeditArticle.tags);
                $scope.bulkUpdate.push(article);
            });

            if($scope.bulkUpdate.length) {
                console.log('bulkUpdate length:', $scope.bulkUpdate.length);
                $http({
                    method: 'POST',
                    data: $scope.bulkUpdate,
                    url: '/api/bulkupdatearticles'
                }).
                success(function(data, status, headers, config) {
                    console.log('bulkupdatearticles data:', data);
                    // $scope.articles[$scope.editArticle._id] = data;
                    $scope.bulkeditArticle = {};
                    $('#modBulkEdit').modal('hide');
                    var msgarticleUpdated = BootstrapDialog.show({
                        type : buttonTypes[3],
                        message : 'Article(s) updated successfully.'
                    });
                    setTimeout(function() {
                        msgarticleUpdated.close();
                    }, 2000);
                    getAllArticles();
                });
            }
        } else {
            var msgupdateArticles = BootstrapDialog.show({
                type : buttonTypes[5],
                message : "You doesn't have rights to perform this action."
            });
            setTimeout(function() {
                msgupdateArticles.close();
            }, 2000);
        }
    }
    // $Bulk Edit

    // ^Approve Selected
    $scope.ensureApprovedSelected = function() {
        if(loggedinUser.updateArticles) {
            $scope.approveSelected = [];
            if($scope.multipleArticles.length === 0) {
                var msgarticleApproved = BootstrapDialog.show({
                    type : buttonTypes[4],
                    message : 'No Article(s) Selected.'
                });
                setTimeout(function() {
                    msgarticleApproved.close();
                }, 2000);
            }
            $scope.multipleArticles.forEach(function(article) {
                $scope.approveSelected.push(article._id);
            });

            if($scope.approveSelected.length) {
                $http({
                    method: 'POST',
                    data: $scope.approveSelected,
                    url: '/api/approveselectedarticles/'
                }).
                success(function(data, status, config, headers) {
                    $scope.approveSelected = [];
                    $scope.$emit('Approve', $scope.multipleArticles.length); // going up!
                    var msgapproveSelected = BootstrapDialog.show({
                        type : buttonTypes[3],
                        message : 'Article(s) approved successfully.'
                    });
                    setTimeout(function() {
                        msgapproveSelected.close();
                        $scope.multipleArticles = [];
                    }, 2000);
                    getAllArticles();
                }).
                error(function(data, status, headers, config) {
                    console.log('approveSelected err:', data);
                });
            }
        } else {
            var msgupdateArticles = BootstrapDialog.show({
                type : buttonTypes[5],
                message : "You doesn't have rights to perform this action."
            });
            setTimeout(function() {
                msgupdateArticles.close();
            }, 2000);
        }
    }
    // $Approve Selected

    // ^Disapprove Selected
    $scope.ensureDisapproveSelected = function() {
        if(loggedinUser.updateArticles) {
            $scope.disapproveSelected = [];
            if($scope.multipleArticles.length === 0) {
                var msgarticleApproved = BootstrapDialog.show({
                    type : buttonTypes[4],
                    message : 'No Article(s) Selected.'
                });
                setTimeout(function() {
                    msgarticleApproved.close();
                }, 2000);
            }
            $scope.multipleArticles.forEach(function(article) {
                $scope.disapproveSelected.push(article._id);
            });

            if($scope.disapproveSelected.length) {
                $http({
                    method: 'POST',
                    data: $scope.disapproveSelected,
                    url: '/api/disapproveselectedarticles/'
                }).
                success(function(data, status, config, headers) {
                    $scope.disapproveSelected = [];
                    $scope.$emit('disApprove', $scope.multipleArticles.length); // going up!
                    $scope.multipleArticles = [];
                    var msgdisapproveSelected = BootstrapDialog.show({
                        type : buttonTypes[3],
                        message : 'Article(s) disapproved successfully.'
                    });
                    setTimeout(function() {
                        msgdisapproveSelected.close();
                    }, 2000);
                    getAllArticles();
                }).
                error(function(data, status, headers, config) {
                    console.log('disapproveSelected err:', data);
                });
            }
        } else {
            var msgupdateArticles = BootstrapDialog.show({
                type : buttonTypes[5],
                message : "You doesn't have rights to perform this action."
            });
            setTimeout(function() {
                msgupdateArticles.close();
            }, 2000);
        }
    }
    // $Disapprove Selected

    // ^Delete Selected
    $scope.ensureDeleteSelected = function(id) {
        if(loggedinUser.delArticles) {
            $scope.deleteSelected = [];
            if($scope.multipleArticles.length === 0) {
                var msgarticleApproved = BootstrapDialog.show({
                    type : buttonTypes[4],
                    message : 'No Article(s) Selected.'
                });
                setTimeout(function() {
                    msgarticleApproved.close();
                }, 2000);
            }
            $scope.multipleArticles.forEach(function(article) {
                // $scope.ensureSelected(article);
                $scope.deleteSelected.push(article._id);
            });

            if($scope.deleteSelected.length) {
                $http({
                    method: 'Delete',
                    url: '/api/deleteselectedarticles',
                    data: $scope.deleteSelected
                }).
                success(function(data, status, headers, config) {
                    $scope.deleteSelected = [];
                    $scope.multipleArticles = [];
                    var msgdisapproveSelected = BootstrapDialog.show({
                        type : buttonTypes[3],
                        message : 'Article(s) deleted successfully.'
                    });
                    setTimeout(function() {
                        msgdisapproveSelected.close();
                    }, 2000);
                    getAllArticles();
                }).
                error(function(data, status, headers, config) {
                    console.log('deleteSelected articles err:', data);
                });
            }
        } else {
            var msgdelArticles = BootstrapDialog.show({
                type : buttonTypes[5],
                message : "You doesn't have rights to perform this action."
            });
            setTimeout(function() {
                msgdelArticles.close();
            }, 2000);
        }
    }
    // $Delete Selected

    $scope.ensureSelected = function(id) {
        // if ($scope.articles[$scope.articles.indexOf(id)].approved == false)
        //     $scope.approved($scope.articles.indexOf(id));
        
        // if approveMultiple, approve the articles, else delete the articles.
        $scope.approveMultiple ? $scope.approved($scope.articles.indexOf(id)) 
        : $scope.update($scope.articles.indexOf(id));
    }

    $scope.approved = function(id) {
        $scope.articles[id].approved = !$scope.articles[id].approved;
        $scope.update(id);
    }

    $scope.ensureApproved = function(id) {
        if ($scope.articles[id].approved == false)
            $scope.approved(id);
    }

    $scope.ensureApprovedAll = function(id) {
        $scope.articles.forEach(function(article, id) {
            $scope.ensureApproved(id);
        });
    }

    $scope.star = function(id) {
        $scope.articles[id].starred = !$scope.articles[id].starred;
        $scope.update(id);
    }

    $scope.update = function(id) {
        if(loggedinUser.updateArticles) {
            $http({
                method: 'PUT',
                url: '/api/stararticle/' + $scope.articles[id]._id,
                data: $scope.articles[id]
            }).
            success(function(data, status, headers, config) {
                $scope.$emit('star', $scope.articles[id].starred);
                $scope.articles.splice(id, 1);
                var msgstarredArticles = BootstrapDialog.show({
                    type : buttonTypes[3],
                    message : "Article starred successfully."
                });
                setTimeout(function() {
                    msgstarredArticles.close();
                }, 2000);
            }).
            error(function(data, status, headers, config) {
                console.log('star article err:', data);
            })
        } else {
            var msgupdateArticles = BootstrapDialog.show({
                type : buttonTypes[5],
                message : "You doesn't have rights to perform this action."
            });
            setTimeout(function() {
                msgupdateArticles.close();
            }, 2000);
        }
        // if($scope.approveMultiple) {
        //     $http({
        //         method: 'POST',
        //         data: $scope.articles[id],
        //         url: '/api/articles/' + $scope.articles[id]._id
        //     }).
        //     success(function(data, status, headers, config) {
        //         $scope.multipleArticles.length ? $scope.multipleArticles.splice($scope.multipleArticles.indexOf(data), 1) : '';
        //         // $scope.multipleArticles.length === 0 ? getAllArticles() : '';
        //         if($scope.multipleArticles.length === 0 & $scope.type == 'pending') {
        //             var msgarticleApproved = BootstrapDialog.show({
        //                 type : buttonTypes[3],
        //                 message : 'Selected Articles approved successfully.'
        //             });
        //             setTimeout(function() {
        //                 $scope.approveMultiple = false;
        //                 msgarticleApproved.close();
        //             }, 2000);
        //             getAllArticles();
        //         } else if($scope.multipleArticles.length === 0 & $scope.type == 'approved') {
        //             var msgarticleApproved = BootstrapDialog.show({
        //                 type : buttonTypes[3],
        //                 message : 'Selected Articles disapproved successfully.'
        //             });
        //             setTimeout(function() {
        //                 $scope.approveMultiple = false;
        //                 msgarticleApproved.close();
        //             }, 2000);
        //             getAllArticles();
        //         }
        //         // else if($scope.articles.length === 0 & $scope.type == 'pending') {
        //         //     var msgarticleApproved = BootstrapDialog.show({
        //         //         type : buttonTypes[3],
        //         //         message : 'All Articles approved successfully.'
        //         //     });
        //         //     setTimeout(function() {
        //         //         msgarticleApproved.close();
        //         //     }, 2000);
        //         //     getAllArticles();
        //         // }
        //     });
        // } else if($scope.deleteMultiple) {
        //     $http({
        //         method: 'DELETE',
        //         url: '/api/articles/' + $scope.articles[id]._id
        //     }).
        //     success(function(data, status, headers, config) {
        //         $scope.multipleArticles.length ? $scope.multipleArticles.splice($scope.multipleArticles.indexOf(data), 1) : '';
        //         if($scope.multipleArticles.length === 0) {
        //             var msgarticleApproved = BootstrapDialog.show({
        //                 type : buttonTypes[3],
        //                 message : 'Selected Articles deleted successfully.'
        //             });
        //             setTimeout(function() {
        //                 $scope.deleteMultiple = false;
        //                 msgarticleApproved.close();
        //             }, 2000);
        //             getAllArticles();
        //         }
        //     });
        // }
    }

    $scope.upload = function(files) {
        if (files && files.length) {
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                Upload.upload({
                    url: '/api/images',
                    fields: {
                        'username': $scope.username
                    },
                    file: file
                }).progress(function(evt) {
                    var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                    console.log('progress: ' + progressPercentage + '% ' + evt.config.file.name);
                }).success(function(data, status, headers, config) {
                    $scope.editArticle.imgUrl = data.path;

                    // returnValue=JSON.stringify(data.path);
                    // console.log(config);
                    // console.log('file ' + config.file.name + 'uploaded. Response: ' + JSON.stringify(data));
                });
            }
        }
    };

    $scope.getImage = function() {
        if ($scope.editArticle.imgUrl == '' || $scope.editArticle.imgUrl == undefined) {
            return '/images/no_image.jpg';
        } else {
            return $scope.editArticle.imgUrl;
        };
    }

}

function FeedsCtrl($scope, $http) {
    $http({
        method: 'GET',
        url: '/api/feeds'
    }).
    success(function(data, status, headers, config) {
        $scope.feeds = data;
    }).
    error(function(data, status, headers, config) {
        $scope.feeds = []
    });

    $scope.delete = function(id) {
        if(loggedinUser.delFeeds) {
            var delFeed = $scope.feeds[id];

            BootstrapDialog.confirm({
                title : 'Delete Feed',
                type : buttonTypes[5],
                message : 'Are you sure to delete?',
                btnOKLabel : 'Delete',
                callback : function(yes) {
                    if(yes) {
                        $http({
                            method: 'DELETE',
                            url: '/api/feeds/' + delFeed._id
                        }).
                        success(function(data, status, headers, config) {
                            // $scope.feeds[id] = data;
                            $scope.feeds.splice(id, 1);
                            var msgfeedDeleted = BootstrapDialog.show({
                                type : buttonTypes[3],
                                message : 'Feed deleted successfully.'
                            });
                            setTimeout(function() {
                                msgfeedDeleted.close();
                            }, 2000);
                        });
                    }
                }
            });
        } else {
            var msgdelFeeds = BootstrapDialog.show({
                type : buttonTypes[5],
                message : "You doesn't have rights to perform this action."
            });
            setTimeout(function() {
                msgdelFeeds.close();
            }, 2000);
        }
    }

    $scope.add = function() {
        if(loggedinUser.addFeeds) {
            $http({
                method: 'POST',
                data: $scope.addFeed,
                url: '/api/feeds'
            }).
            success(function(data, status, headers, config) {
                $scope.feeds.push(data);
                $scope.addFeed = {};
                var msgfeedAdded = BootstrapDialog.show({
                    type : buttonTypes[3],
                    message : 'Feed added successfully.'
                });
                setTimeout(function() {
                    msgfeedAdded.close();
                }, 2000);
            });
        } else {
            var msgaddFeeds = BootstrapDialog.show({
                type : buttonTypes[5],
                message : "You doesn't have rights to perform this action."
            });
            setTimeout(function() {
                msgaddFeeds.close();
            }, 2000);
        }
    }

    $scope.dispUpdate = function(id) {
        var editFeed = $scope.feeds[id];
        $scope.editFeedId = id;
        $http({
            method: 'GET',
            url: '/api/feeds/' + editFeed._id
        }).
        success(function(data, status, headers, config) {
            $scope.editFeed = data;
        }).
        error(function(data, status, headers, config) {
            $scope.editFeed = {}
        });
    }

    $scope.update = function() {
        if(loggedinUser.updateFeeds) {
            console.log('update feed:', $scope.editFeed);
            $http({
                method: 'POST',
                data: $scope.editFeed,
                url: '/api/feeds/' + $scope.editFeed._id
            }).
            success(function(data, status, headers, config) {
                $scope.feeds[$scope.editFeedId] = data;
                $('#modFeed').modal('hide');
                var msgfeedUpdated = BootstrapDialog.show({
                    type : buttonTypes[3],
                    message : 'Feed updated successfully.'
                });
                setTimeout(function() {
                    msgfeedUpdated.close();
                }, 2000);
            });
        } else {
            var msgupdateFeeds = BootstrapDialog.show({
                type : buttonTypes[5],
                message : "You doesn't have rights to perform this action."
            });
            setTimeout(function() {
                msgupdateFeeds.close();
            }, 2000);
        }
    }

    $scope.addTag = function() {
        if ($scope.editFeed.tags == undefined)
            $scope.editFeed.tags = []
        if ($scope.editFeed.tags.indexOf(editFeedForm.editTag.value) == -1)
            $scope.editFeed.tags.push(editFeedForm.editTag.value);
    }

    $scope.deleteTag = function(id) {
        $scope.editFeed.tags.splice(id, 1);
    }

    $scope.bpFeedStatus = function(status) {
        if (status == 'OK' || status == 'New') return 'label-success';
        else if (status == 'Incomplete') return 'label-warning';
        else return 'label-error';
    }

}


function CategorysCtrl($scope, $http, Upload) {
    $scope.editCategory = {};
    $scope.delete = function(id) {
        if(loggedinUser.delCategories) {
            var delCategory = $scope.categorys[id];

            console.log(delCategory, id, JSON.stringify($scope.categorys));
            BootstrapDialog.confirm({
                title : 'Delete Category',
                type : buttonTypes[5],
                message : 'Are you sure to delete?',
                btnOKLabel : 'Delete',
                callback : function(yes) {
                    if(yes) {
                        $http({
                            method: 'DELETE',
                            url: '/api/categorys/' + delCategory._id
                        }).
                        success(function(data, status, headers, config) {
                            $scope.categorys.splice(id, 1);
                            var msgcategoryDeleted = BootstrapDialog.show({
                                type : buttonTypes[3],
                                message : 'Category deleted successfully.'
                            });
                            setTimeout(function() {
                                msgcategoryDeleted.close();
                            }, 2000);
                        });
                    }
                }
            });
        } else {
            var msgdelCategories = BootstrapDialog.show({
                type : buttonTypes[5],
                message : "You doesn't have rights to perform this action."
            });
            setTimeout(function() {
                msgdelCategories.close();
            }, 2000);
        }
    }

    $scope.add = function() {
        if(loggedinUser.addCategories) {
            $http({
                method: 'POST',
                data: $scope.addCategory,
                url: '/api/categorys'
            }).
            success(function(data, status, headers, config) {
                $scope.categorys.push(data);
                $scope.addCategory = {};
                var msgcategoryAdded = BootstrapDialog.show({
                    type : buttonTypes[3],
                    message : 'Category added successfully.'
                });
                setTimeout(function() {
                    msgcategoryAdded.close();
                }, 2000);
            });
        } else {
            var msgaddCategories = BootstrapDialog.show({
                type : buttonTypes[5],
                message : "You doesn't have rights to perform this action."
            });
            setTimeout(function() {
                msgaddCategories.close();
            }, 2000);
        }
    }

    $scope.dispUpdate = function(id) {
        var editCategory = $scope.categorys[id];
        $scope.editCategoryId = id;
        $http({
            method: 'GET',
            url: '/api/categorys/' + editCategory._id
        }).
        success(function(data, status, headers, config) {
            $scope.editCategory = data;

            $scope.cathttpAdded = false;
            if($scope.editCategory.imgUrl && $scope.editCategory.imgUrl.indexOf('http') == -1) {
                $scope.editCategory.imgUrl = window.location.protocol + '//' + window.location.host
                                        + $scope.editCategory.imgUrl;
                $scope.cathttpAdded = true;
                $scope.catoldimgUrl = $scope.editCategory.imgUrl;
            }
        }).
        error(function(data, status, headers, config) {
            $scope.editCategory = {}
        });
    }

    $scope.update = function() {
        if(loggedinUser.updateCategories) {
            if($scope.editCategory.name && $scope.editCategory.imgUrl) {
                if($scope.cathttpAdded && $scope.catoldimgUrl == $scope.editCategory.imgUrl) {
                    $scope.editCategory.imgUrl = getPath($scope.editCategory.imgUrl).pathname;
                }

                $http({
                    method: 'POST',
                    data: $scope.editCategory,
                    url: '/api/categorys/' + $scope.editCategory._id
                }).
                success(function(data, status, headers, config) {
                    $scope.categorys[$scope.editCategoryId] = data;
                    $('#modCategory').modal('hide');
                    var msgcategoryUpdated = BootstrapDialog.show({
                        type : buttonTypes[3],
                        message : 'Category updated successfully.'
                    });
                    setTimeout(function() {
                        msgcategoryUpdated.close();
                    }, 2000);
                });
            } else {
                var msgMandetory = BootstrapDialog.show({
                    type : buttonTypes[4],
                    message : "Please fill all fields."
                });
                setTimeout(function() {
                    msgMandetory.close();
                }, 2000);
            }
        } else {
            var msgupdateCategories = BootstrapDialog.show({
                type : buttonTypes[5],
                message : "You doesn't have rights to perform this action."
            });
            setTimeout(function() {
                msgupdateCategories.close();
            }, 2000);
        }
    }

    $scope.bpCategoryStatus = function(status) {
        if (status == 'OK' || status == 'New') return 'label-success';
        else if (status == 'Incomplete') return 'label-warning';
        else return 'label-error';
    }

    $scope.upload = function(files) {
        if (files && files.length) {
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                Upload.upload({
                    url: '/api/images',
                    fields: {
                        'username': $scope.username
                    },
                    file: file
                }).progress(function(evt) {
                    var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                    console.log('progress: ' + progressPercentage + '% ' + evt.config.file.name);
                }).success(function(data, status, headers, config) {
                    $scope.editCategory.imgUrl = data.path;

                    // returnValue=JSON.stringify(data.path);
                    // console.log(config);
                    // console.log('file ' + config.file.name + 'uploaded. Response: ' + JSON.stringify(data));
                });
            }
        }
    };

    $scope.getImage = function() {
        if ($scope.editCategory.imgUrl == '' || $scope.editCategory.imgUrl == undefined) {
            return '/images/no_image.jpg';
        } else {
            return $scope.editCategory.imgUrl;
        };
    }

}


function TagsCtrl($scope, $http, Upload) {
    $scope.editTag = {};
    $scope.delete = function(id) {
        if(loggedinUser.delTags) {
            var delTag = $scope.tags[id];
            BootstrapDialog.confirm({
                title : 'Delete Tag',
                type : buttonTypes[5],
                message : 'Are you sure to delete?',
                btnOKLabel : 'Delete',
                callback : function(yes) {
                    if(yes) {
                        $http({
                            method: 'DELETE',
                            url: '/api/tags/' + delTag._id
                        }).
                        success(function(data, status, headers, config) {
                            $scope.tags.splice(id, 1);
                            var msgtagDeleted = BootstrapDialog.show({
                                type : buttonTypes[3],
                                message : 'Tag deleted successfully.'
                            });
                            setTimeout(function() {
                                msgtagDeleted.close();
                            }, 2000);
                        });
                    }
                }
            });
        } else {
            var msgdelTags = BootstrapDialog.show({
                type : buttonTypes[5],
                message : "You doesn't have rights to perform this action."
            });
            setTimeout(function() {
                msgdelTags.close();
            }, 2000);
        }
    }

    $scope.add = function() {
        if(loggedinUser.addTags) {
            $http({
                method: 'POST',
                data: $scope.addTag,
                url: '/api/tags'
            }).
            success(function(data, status, headers, config) {
                $scope.tags.push(data);
                $scope.addTag = {};
                var msgtagAdded = BootstrapDialog.show({
                    type : buttonTypes[3],
                    message : 'Tag added successfully.'
                });
                setTimeout(function() {
                    msgtagAdded.close();
                }, 2000);
            });
        } else {
            var msgaddTags = BootstrapDialog.show({
                type : buttonTypes[5],
                message : "You doesn't have rights to perform this action."
            });
            setTimeout(function() {
                msgaddTags.close();
            }, 2000);
        }
    }

    $scope.dispUpdate = function(id) {
        var editTag = $scope.tags[id];
        $scope.editTagId = id;
        $http({
            method: 'GET',
            url: '/api/tags/' + editTag._id
        }).
        success(function(data, status, headers, config) {
            $scope.editTag = data;
            
            $scope.taghttpAdded = false;
            if($scope.editTag.imgUrl && $scope.editTag.imgUrl.indexOf('http') == -1) {
                $scope.editTag.imgUrl = window.location.protocol + '//' + window.location.host
                                        + $scope.editTag.imgUrl;
                $scope.taghttpAdded = true;
                $scope.tagoldimgUrl = $scope.editTag.imgUrl;
            }
        }).
        error(function(data, status, headers, config) {
            $scope.editTag = {}
        });
    }

    $scope.update = function() {
        if(loggedinUser.updateTags) {
            if($scope.editTag.boostValue && $scope.editTag.name && $scope.editTag.imgUrl) {
                if($scope.taghttpAdded && $scope.editTag.imgUrl && $scope.tagoldimgUrl == $scope.editTag.imgUrl) {
                    $scope.editTag.imgUrl = getPath($scope.editTag.imgUrl).pathname;
                }

                $http({
                    method: 'POST',
                    data: $scope.editTag,
                    url: '/api/tags/' + $scope.editTag._id
                }).
                success(function(data, status, headers, config) {
                    $scope.tags[$scope.editTagId] = data;
                    $('#modTag').modal('hide');
                    var msgtagUpdated = BootstrapDialog.show({
                        type : buttonTypes[3],
                        message : 'Tag updated successfully.'
                    });
                    setTimeout(function() {
                        msgtagUpdated.close();
                    }, 2000);
                });
            } else {
                var msgMandetory = BootstrapDialog.show({
                    type : buttonTypes[4],
                    message : "Please fill all fields."
                });
                setTimeout(function() {
                    msgMandetory.close();
                }, 2000);
            }

            // !$scope.imgFileUploaded ? console.log('tag imgUrl:', getPath($scope.editTag.imgUrl).pathname);
            // if($scope.taghttpAdded && $scope.tagoldimgUrl != $scope.editTag.imgUrl && !$scope.tagimgFileUploaded) {
            //     // $scope.editTag.imgUrl = $scope.editTag.imgUrl; // Remove the previously added host path from imgUrl before updating.
            //     console.log('no change:', $scope.editTag.imgUrl);
            // } else if($scope.taghttpAdded && !$scope.tagimgFileUploaded) {
            //     $scope.editTag.imgUrl = getPath($scope.editTag.imgUrl).pathname; // This is the actual image url. Dont remove host from this.
            //     console.log('changed:', $scope.editTag.imgUrl);
            // }
        } else {
            var msgupdateTags = BootstrapDialog.show({
                type : buttonTypes[5],
                message : "You doesn't have rights to perform this action."
            });
            setTimeout(function() {
                msgupdateTags.close();
            }, 2000);
        }
    }

    $scope.bpTagStatus = function(status) {
        if (status == 'OK' || status == 'New') return 'label-success';
        else if (status == 'Incomplete') return 'label-warning';
        else return 'label-error';
    }

    $scope.upload = function(files) {
        if (files && files.length) {
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                Upload.upload({
                    url: '/api/images',
                    fields: {
                        'username': $scope.username
                    },
                    file: file
                }).progress(function(evt) {
                    var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                    console.log('progress: ' + progressPercentage + '% ' + evt.config.file.name);
                }).success(function(data, status, headers, config) {
                    $scope.editTag.imgUrl = data.path;
                    // returnValue=JSON.stringify(data.path);
                    // console.log(config);
                    // console.log('file ' + config.file.name + 'uploaded. Response: ' + JSON.stringify(data));
                });
            }
        }
    };

    $scope.getImage = function() {
        if ($scope.editTag.imgUrl == '' || $scope.editTag.imgUrl == undefined) {
            return '/images/no_image.jpg';
        } else {
            return $scope.editTag.imgUrl;
        };
    }

}


function LogoutCtrl($scope, $http) {
    console.log('test');
    window.location.href = "/logout";

}

function LocationsCtrl($scope, $http) {
    console.log('LocationsCtrl loggedinUser:', loggedinUser);
    $scope.addLocation= {
        name :'',
        details:''
    };

    $scope.location_options = {
      country: 'in',
      types: '(cities)'
    };

    $scope.delete = function(id) {
        if(loggedinUser.delLocations) {
            var delLocation = $scope.locations[id];

            console.log(delLocation, id, JSON.stringify($scope.locations));
            BootstrapDialog.confirm({
                title : 'Delete Location',
                type : buttonTypes[5],
                message : 'Are you sure to delete?',
                btnOKLabel : 'Delete',
                callback : function(yes) {
                    if(yes) {
                        $http({
                            method: 'DELETE',
                            url: '/api/locations/' + delLocation._id
                        }).
                        success(function(data, status, headers, config) {
                            $scope.locations.splice(id, 1);
                            var msglocationDeleted = BootstrapDialog.show({
                                type : buttonTypes[3],
                                message : 'Location deleted successfully.'
                            });
                            setTimeout(function() {
                                msglocationDeleted.close();
                            }, 2000);
                        });
                    }
                }
            });
        } else {
            var msgdelLocations = BootstrapDialog.show({
                type : buttonTypes[5],
                message : "You doesn't have rights to perform this action."
            });
            setTimeout(function() {
                msgdelLocations.close();
            }, 2000);
        }
    }

    $scope.add = function() {
        if(loggedinUser.addLocations) {
            console.log(typeof($scope.addLocation.details), 'details');
            $http({
                method: 'POST',
                data: $scope.addLocation,
                url: '/api/locations'
            }).
            success(function(data, status, headers, config) {
                $scope.locations.push(data);
                $scope.addLocation = {};
                var msglocationAdded = BootstrapDialog.show({
                    type : buttonTypes[3],
                    message : 'Location added successfully.'
                });
                setTimeout(function() {
                    msglocationAdded.close();
                }, 2000);
            });
        } else {
            var msgaddLocations = BootstrapDialog.show({
                type : buttonTypes[5],
                message : "You doesn't have rights to perform this action."
            });
            setTimeout(function() {
                msgaddLocations.close();
            }, 2000);
        }
    }

    $scope.dispUpdate = function(id) {
        var editLocation = $scope.locations[id];
        $scope.editLocationId = id;
        $http({
            method: 'GET',
            url: '/api/locations/' + editLocation._id
        }).
        success(function(data, status, headers, config) {
            $scope.editLocation = data;
        }).
        error(function(data, status, headers, config) {
            $scope.editLocation = {}
        });
    }

    $scope.update = function() {
        if(loggedinUser.updateLocations) {
            $http({
                method: 'POST',
                data: $scope.editLocation,
                url: '/api/locations/' + $scope.editLocation._id
            }).
            success(function(data, status, headers, config) {
                $scope.locations[$scope.editLocationId] = data;
                $('#modLocation').modal('hide');
                var msglocationUpdated = BootstrapDialog.show({
                    type : buttonTypes[3],
                    message : 'Location updated successfully.'
                });
                setTimeout(function() {
                    msglocationUpdated.close();
                }, 2000);
            });
        } else {
            var msgupdateLocations = BootstrapDialog.show({
                type : buttonTypes[5],
                message : "You doesn't have rights to perform this action."
            });
            setTimeout(function() {
                msgupdateLocations.close();
            }, 2000);
        }
    }

    $scope.bpLocationStatus = function(status) {
        if (status == 'OK' || status == 'New') return 'label-success';
        else if (status == 'Incomplete') return 'label-warning';
        else return 'label-error';
    }

}


function UsersCtrl($scope, $http, $route, Upload, $timeout) {

    $scope.page = 0;
    $scope.users = {};
    var usersUrl = '/api/users/' + $scope.page;
    $http({
        method: 'GET',
        url: usersUrl
    }).
    success(function(data, status, headers, config) {
        $scope.users = data;
    }).
    error(function(data, status, headers, config) {
        $scope.users = []
    });

    console.log($scope.users);

    $scope.fetchUsers = function(direction) {

        var paginate = false;

        if (direction == 'previous' && $scope.page != 0) {
            $scope.page--;
            paginate = true;
        } else if (direction == 'next') {
            $scope.page++;
            paginate = true;
        };

        if (paginate) {
            var articlesUrl = '/api/users/' + $scope.page;
            $http({
                method: 'GET',
                url: usersUrl
            }).success(function(data, status, headers, config) {
                $scope.users = data;
                console.log(data);
            }).error(function(data, status, headers, config) {
                $scope.users = []
            });
        };
    }
}

function StaffsCtrl($scope, $http, $route, Upload, $timeout) {
    $scope.page = 0;
    $scope.staffs = {};
    var staffsUrl = '/api/fetchstaffs/' + $scope.page;
    $http({
        method: 'GET',
        url: staffsUrl
    }).
    success(function(data, status, headers, config) {
        $scope.staffs = data;
    }).
    error(function(data, status, headers, config) {
        $scope.staffs = []
    });

    $scope.fetchStaffs = function(direction) {

        var paginate = false;

        if (direction == 'previous' && $scope.page != 0) {
            $scope.page--;
            paginate = true;
        } else if (direction == 'next') {
            $scope.page++;
            paginate = true;
        };

        if (paginate) {
            var articlesUrl = '/api/staffs/' + $scope.page;
            $http({
                method: 'GET',
                url: staffsUrl
            }).success(function(data, status, headers, config) {
                $scope.staffs = data;
                console.log(data);
            }).error(function(data, status, headers, config) {
                $scope.staffs = []
            });
        };
    }

    // ^Add Staff
    $scope.add = function() {
        if(loggedinUser.addStaffs) {
            if($scope.addStaff.username && $scope.addStaff.password) {
                $http({
                    method: 'POST',
                    data: $scope.addStaff,
                    url: '/api/staffs'
                }).
                success(function(data, status, headers, config) {
                    $scope.staffs.push(data);
                    $scope.addStaff = {};
                    var msgstaffAdded = BootstrapDialog.show({
                        type : buttonTypes[3],
                        message : 'Staff added successfully.'
                    });
                    setTimeout(function() {
                        msgstaffAdded.close();
                    }, 2000);
                });
            }
        } else {
            var msgaddStaffs = BootstrapDialog.show({
                type : buttonTypes[5],
                message : "You doesn't have rights to perform this action."
            });
            setTimeout(function() {
                msgaddStaffs.close();
            }, 2000);
        }
    }
    // $Add Staff

    $scope.genderDropDown = {};
    $scope.genders = ["Male", "Female"];

    // ^Get Staff Detail
    $scope.dispUpdate = function(id) {
        var editStaff = $scope.staffs[id];
        $scope.editStaffId = id;
        $http({
            method: 'GET',
            url: '/api/staffs/' + editStaff._id
        }).
        success(function(data, status, headers, config) {
            $scope.editStaff = data;
        }).
        error(function(data, status, headers, config) {
            $scope.editStaff = {}
        });
    }
    // $Get Staff Detail

    // ^Update Staff
    $scope.update = function() {
        if(loggedinUser.updateStaffs) {
            // $scope.editStaff.gender = $("editGender").val();
            $http({
                method: 'PUT',
                data: $scope.editStaff,
                url: '/api/staffs/' + $scope.editStaff._id
            }).
            success(function(data, status, headers, config) {
                $scope.staffs[$scope.editStaffId] = data;
                $('#modStaff').modal('hide');
                var msgstaffUpdated = BootstrapDialog.show({
                    type : buttonTypes[1],
                    message : 'Staff updated successfully.'
                });
                setTimeout(function() {
                    msgstaffUpdated.close();
                }, 2000);
            });
        } else {
            var msgupdateStaffs = BootstrapDialog.show({
                type : buttonTypes[5],
                message : "You doesn't have rights to perform this action."
            });
            setTimeout(function() {
                msgupdateStaffs.close();
            }, 2000);
        }
    }
    // $Update Staff

    // ^Delete Staff
    $scope.delete = function(id) {
        if(loggedinUser.delStaffs) {
            var delStaff = $scope.staffs[id];
            BootstrapDialog.confirm({
                title : 'Delete Staff',
                type : buttonTypes[5],
                message : 'Are you sure to delete?',
                btnOKLabel : 'Delete',
                callback : function(yes) {
                    if(yes) {
                        $http({
                            method: 'DELETE',
                            url: '/api/staffs/' + delStaff._id
                        }).
                        success(function(data, status, headers, config) {
                            $scope.staffs.splice(id, 1);
                            var msgstaffDeleted = BootstrapDialog.show({
                                type : buttonTypes[3],
                                message : 'Staff deleted successfully.'
                            });
                            setTimeout(function() {
                                msgstaffDeleted.close();
                            }, 2000);
                        });
                    }
                }
            });
        } else {
            var msgdelStaffs = BootstrapDialog.show({
                type : buttonTypes[5],
                message : "You doesn't have rights to perform this action."
            });
            setTimeout(function() {
                msgdelStaffs.close();
            }, 2000);
        }
    }
    // $Delete Staff

    // ^Ban Staff
    $scope.ban = function(id) {
        if(loggedinUser.updateStaffs) {
            var banStaff = $scope.staffs[id];
            BootstrapDialog.confirm({
                title : 'Ban Staff',
                type : buttonTypes[5],
                message : 'Are you sure to ban?',
                btnOKLabel : 'Ban',
                callback : function(yes) {
                    if(yes) {
                        $http({
                            method: 'PUT',
                            url: '/api/banstaffs/' + banStaff._id
                        }).
                        success(function(data, status, headers, config) {
                            // $scope.staffs.splice(id, 1);
                            $scope.staffs[id] = data;
                            var msgstaffBanned = BootstrapDialog.show({
                                type: buttonTypes[5],
                                message: 'Staff banned successfully.'
                            });
                            setTimeout(function() {
                                msgstaffBanned.close();
                            }, 2000);
                        });
                    }
                }
            });
        } else {
            var msgupdateStaffs = BootstrapDialog.show({
                type : buttonTypes[5],
                message : "You doesn't have rights to perform this action."
            });
            setTimeout(function() {
                msgupdateStaffs.close();
            }, 2000);
        }
    }
    // $Ban Staff

    // ^Unban Staff
    $scope.unban = function(id) {
        if(loggedinUser.updateStaffs) {
            var unbanStaff = $scope.staffs[id];
            BootstrapDialog.confirm({
                title : 'Unban Staff',
                type : buttonTypes[4],
                message : 'Are you sure to unban?',
                btnOKLabel : 'Unban',
                callback : function(yes) {
                    if(yes) {
                        $http({
                            method: 'PUT',
                            url: '/api/unbanstaffs/' + unbanStaff._id
                        }).
                        success(function(data, status, headers, config) {
                            // $scope.staffs.splice(id, 1);
                            $scope.staffs[id] = data;
                            var msgstaffUnbanned = BootstrapDialog.show({
                                type : buttonTypes[3],
                                message : 'Staff Unbanned successfully.'
                            });
                            setTimeout(function() {
                                msgstaffUnbanned.close();
                            }, 2000);
                        });
                    }
                }
            });
        } else {
            var msgupdateStaffs = BootstrapDialog.show({
                type : buttonTypes[5],
                message : "You doesn't have rights to perform this action."
            });
            setTimeout(function() {
                msgupdateStaffs.close();
            }, 2000);
        }
    }
    // $Unban Staff
}

function StaffRoleCtrl($scope, $http) {
    $http({
        method: 'GET',
        url: '/api/getstaffs'
    }).
    success(function(data, status, headers, config) {
        $scope.staffs = data;
    }).
    error(function(data, status, headers, config) {
        $scope.staffs = []
    });

    // $http({
    //     method: 'GET',
    //     url: '/api/getstaffrole'
    // }).
    // success(function(data, status, headers, config) {
    //     $scope.staffroles = data;
    //     console.log('get staffroles:', $scope.staffroles);
    // }).
    // error(function(data, status, headers, config) {
    //     $scope.staffroles = []
    // });

    // $scope.setRights = function(index, value, category) {
    //     $scope.staffroles[index][category] = value;
    // }

    $scope.updateRole = function(index, staff) {
        // console.log('updateRole:', staff);
        $http({
            method: 'PUT',
            url: '/api/staffs/' + staff._id,
            data: staff
        }).
        success(function(data, status, headers, config) {
            $scope.staffs[index] = data;
            // console.log('LocationsCtrl loggedinUser:', loggedinUser);
            // console.log('StaffRoleCtrl data:', data);
            var msgupdateRole = BootstrapDialog.show({
                type : buttonTypes[3],
                message : 'Staff Role updated successfully.'
            });
            setTimeout(function() {
                msgupdateRole.close();
            }, 2000);
        }).
        error(function(data, status, headers, config) {
            $scope.staffs = []
        });
    };

    // $scope.updateRole = function(staffid, index) {
    //     $http({
    //         method: 'PUT',
    //         url: '/api/staffrole/' + staffid,
    //         data: $scope.staffroles[index]
    //     }).
    //     success(function(data, status, headers, config) {
    //         $scope.staffroles[index] = data;
    //         var msgupdateRole = BootstrapDialog.show({
    //             type : buttonTypes[3],
    //             message : 'Staff Role updated successfully.'
    //         });
    //         setTimeout(function() {
    //             msgupdateRole.close();
    //         }, 2000);
    //     }).
    //     error(function(data, status, headers, config) {
    //         $scope.staffroles = []
    //     });
    // };
}