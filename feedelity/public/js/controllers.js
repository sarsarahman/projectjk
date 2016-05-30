'use strict';

var buttonTypes = [BootstrapDialog.TYPE_DEFAULT, BootstrapDialog.TYPE_INFO, BootstrapDialog.TYPE_PRIMARY,
                BootstrapDialog.TYPE_SUCCESS, BootstrapDialog.TYPE_WARNING, BootstrapDialog.TYPE_DANGER];

/* Controllers */

function FeedelityCtrl($scope, $http, Upload) {


    $scope.feeds = [];
    $scope.tags = [];
    $scope.categorys = [];
    $scope.locations = [];
    $scope.trimmedTags = [];
    $scope.trimmedLocations = [];
    $scope.trimmedCategorys = [];


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


    $scope.refresh = function() {
        $http({
            method: 'GET',
            url: '/api/refresh'
        }).
        success(function(data, status, headers, config) {
            $scope.feeds = data;
            $scope.$broadcast('feedsRefreshed');
        });
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
                    returnValue = JSON.stringify(data.path);
                    // console.log(config);
                    // console.log('file ' + config.file.name + 'uploaded. Response: ' + JSON.stringify(data));
                });
            }
        }
    };

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
            console.log('get all articles');
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
    }

    $scope.add = function() {
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
        }).
        error(function(data, status, headers, config) {
            $scope.editArticle = {}
        });
    }

    $scope.updateArticle = function() {
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
    }

    $scope.updateArticleQuickEdit = function() {
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
    }

    $scope.multipleArticles = [];
    $scope.chkValue = false;
    $scope.multipleApprove = function(id, chkValue) {
        chkValue ? $scope.multipleArticles.push($scope.articles[id]) : 
        $scope.multipleArticles.splice($scope.multipleArticles.indexOf($scope.articles[id]), 1);
    }

    $scope.ensureApprovedSelected = function(id) {
        if($scope.multipleArticles.length === 0) {
            var msgarticleApproved = BootstrapDialog.show({
                type : buttonTypes[4],
                message : 'No Article(s) Selected.'
            });
            setTimeout(function() {
                msgarticleApproved.close();
            }, 2000);
        }
        $scope.multipleArticles.forEach(function(article, id) {
            $scope.ensureSelected(article);
        });
    }

    $scope.ensureSelected = function(id) {
        // if ($scope.articles[$scope.articles.indexOf(id)].approved == false)
        //     $scope.approved($scope.articles.indexOf(id));
        $scope.approved($scope.articles.indexOf(id));
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
        $http({
            method: 'POST',
            data: $scope.articles[id],
            url: '/api/articles/' + $scope.articles[id]._id
        }).
        success(function(data, status, headers, config) {
            $scope.multipleArticles.length ? $scope.multipleArticles.splice($scope.multipleArticles.indexOf(data), 1) : '';
            // $scope.multipleArticles.length === 0 ? getAllArticles() : '';
            if($scope.multipleArticles.length === 0 & $scope.type == 'pending') {
                var msgarticleApproved = BootstrapDialog.show({
                    type : buttonTypes[3],
                    message : 'Selected Articles approved successfully.'
                });
                setTimeout(function() {
                    msgarticleApproved.close();
                }, 2000);
                getAllArticles();
            } else if($scope.multipleArticles.length === 0 & $scope.type == 'approved') {
                var msgarticleApproved = BootstrapDialog.show({
                    type : buttonTypes[3],
                    message : 'Selected Articles disapproved successfully.'
                });
                setTimeout(function() {
                    msgarticleApproved.close();
                }, 2000);
                getAllArticles();
            } else if($scope.articles.length === 0 & $scope.type == 'pending') {
                var msgarticleApproved = BootstrapDialog.show({
                    type : buttonTypes[3],
                    message : 'All Articles approved successfully.'
                });
                setTimeout(function() {
                    msgarticleApproved.close();
                }, 2000);
                getAllArticles();
            }
        });
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
    $scope.delete = function(id) {
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
    }

    $scope.add = function() {
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
    }

    $scope.add = function() {
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
        }).
        error(function(data, status, headers, config) {
            $scope.editCategory = {}
        });
    }

    $scope.update = function() {
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
    }

    $scope.add = function() {
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
        }).
        error(function(data, status, headers, config) {
            $scope.editTag = {}
        });
    }

    $scope.update = function() {
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

    $scope.addLocation= {
        name :'',
        details:''
    };

    $scope.location_options = {
      country: 'in',
      types: '(cities)'
    };

    $scope.delete = function(id) {
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
    }

    $scope.add = function() {
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
    }
    // $Update Staff

    // ^Delete Staff
    $scope.delete = function(id) {
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
    }
    // $Delete Staff

    // ^Ban Staff
    $scope.ban = function(id) {
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
    }
    // $Ban Staff

    // ^Unban Staff
    $scope.unban = function(id) {
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
    }
    // $Unban Staff
}