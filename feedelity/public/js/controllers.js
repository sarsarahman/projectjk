'use strict';

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
    var articlesUrl = '/api/articles/' + $scope.type + '/' + $scope.page;
    $http({
        method: 'GET',
        url: articlesUrl
    }).
    success(function(data, status, headers, config) {
        $scope.articles = data;
    }).
    error(function(data, status, headers, config) {
        $scope.articles = []
    });

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
            $scope.articles = data;
        }).
        error(function(data, status, headers, config) {
            $scope.articles = []
        });
    });

    $scope.delete = function(id) {
        var delArticle = $scope.articles[id];
        $http({
            method: 'DELETE',
            url: '/api/articles/' + delArticle._id
        }).
        success(function(data, status, headers, config) {
            $scope.articles.splice(id, 1);
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
        });
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
        $http({
            method: 'DELETE',
            url: '/api/feeds/' + delFeed._id
        }).
        success(function(data, status, headers, config) {
            $scope.feeds.splice(id, 1);
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
        $http({
            method: 'POST',
            data: $scope.editFeed,
            url: '/api/feeds/' + $scope.editFeed._id
        }).
        success(function(data, status, headers, config) {
            $scope.feeds[$scope.editFeedId] = data;
            $('#modFeed').modal('hide');
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
        $http({
            method: 'DELETE',
            url: '/api/categorys/' + delCategory._id
        }).
        success(function(data, status, headers, config) {
            $scope.categorys.splice(id, 1);
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
        $http({
            method: 'DELETE',
            url: '/api/tags/' + delTag._id
        }).
        success(function(data, status, headers, config) {
            $scope.tags.splice(id, 1);
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
        $http({
            method: 'DELETE',
            url: '/api/locations/' + delLocation._id
        }).
        success(function(data, status, headers, config) {
            $scope.locations.splice(id, 1);
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