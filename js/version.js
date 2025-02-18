/* global config infoMessage language */
/*
	Check the latest version of dashticz on github.
	Check domoticz version
	*/

var dashticz_version;
var dashticz_branch;
// eslint-disable-next-line no-unused-vars
var newVersion = '';
var moved = false;
var loginCredentials = '';
// eslint-disable-next-line no-unused-vars
var domoversion = '';
var domoVersion = {
  build: 0,
  version: 0,
  levelNamesEncoded: false,
  newBlindsBehavior: false
}
// eslint-disable-next-line no-unused-vars
var dzVents = '';
// eslint-disable-next-line no-unused-vars
var python = '';
// eslint-disable-next-line no-unused-vars

// eslint-disable-next-line no-unused-vars
function initVersion() {
  return $.ajax({
    url: 'version.txt',
    dataType: 'json',
    cache: false,
    success: function (localdata) {
      dashticz_version = localdata.version;
      dashticz_branch = localdata.branch;
    },
  })
    .then(function () {
      if (
        typeof config === 'undefined' ||
        (typeof config !== 'undefined' &&
          (typeof config['disable_update_check'] === 'undefined' ||
            !config['disable_update_check']))
      ) {
        return $.ajax({
          url:
            'https://raw.githubusercontent.com/Dashticz/dashticz/' +
            dashticz_branch +
            '/version.txt',
          dataType: 'json',
          success: function (data) {
            var message = 'Latest changes made: ' + data.last_changes;

            if (dashticz_version !== data.version) {
              moved = true;
              newVersion =
                '<br><i>Version ' +
                data.version +
                ' is available! <a href="https://github.com/Dashticz/dashticz/tree/' +
                dashticz_branch +
                '" target="_blank">Click here to download</a></i><br><i>' +
                message +
                '</i>';
            } else if (dashticz_version === data.version) {
              moved = false;
              newVersion = '<br><i>You are running latest version.</i>';
            }
            if (moved == true) {
              infoMessage(
                language.misc.new_version + '! (V' + data.version + ')',
                '<a href="https://github.com/Dashticz/dashticz/tree/' +
                  dashticz_branch +
                  '" target="_blank">' +
                  language.misc.download +
                  '</a>'
              );
            }
          },
        }).then(null, function () {
          console.log('Error loading git info. Probably no internet');
          return $.Deferred().resolve();
        });
      }
    })
    .then(function () {
      var basicAuthEnc = config.user_name ? window.btoa(config['user_name'] + ':' + config['pass_word']):'';

      return $.ajax({
        url:
          config['domoticz_ip'] +
          '/json.htm?type=command&param=getversion',
          beforeSend: function(xhr) { if(basicAuthEnc ) { xhr.setRequestHeader("Authorization", "Basic " + basicAuthEnc) } },
          dataType: 'json',
        success: function (data) {
          domoversion = 'Domoticz version: ' + data.version;
          domoVersion.version = parseFloat(data.version);

          try {
            domoVersion.build = parseInt( data.version.match(/build (\d+)(?=\))/)[1]);
          }
          catch(e) {
            console.log('Not able to parse Domoticz build number: ', data.version);
          }
          dzVents = '<br>dzVents version: ' + data.dzvents_version;
          python = '<br> Python version: ' + data.python_version;
          setDomoBehavior();
          
        },
      }).catch(function (err) {
        console.log(err);
        var errorTxt =
          'Error while requesting Domoticz version. Possible causes:<br> Domoticz offline<br>Domoticz IP incorrect in CONFIG.js<br>User credentials incorrect in CONFIG.js<br>Browser IP not whitelisted in Domoticz.';
        return $.Deferred().reject(new Error(errorTxt));
      });
    });
}

/*This function sets certain flags to indicate new behavior has been implemented in the Domoticz version that is used*/
function setDomoBehavior() {
  var domoChanges = {
    newBlindsBehavior: {
      version: 2022.1,
      build: 14535
    },
    levelNamesEncoded: {
      version: 3.9476
    },
    basicAuthRequired: {
      version: 2022.2,
      build: 14078
    },
    api15330: {
      version: 2023.1,
      build: 15327
    }
  }
  
  Object.keys(domoChanges).forEach(function(key) {
    var testVersion = 0 || domoChanges[key].version;
    var testBuild = 0 || domoChanges[key].build;
    var applicable = (domoVersion.version> testVersion) || ((domoVersion.version == testVersion) && (domoVersion.build>=testBuild));
    domoVersion[key] = applicable; 
  });    

  console.log("Domoticz version: ",domoVersion);
}

//# sourceURL=js/version.js
