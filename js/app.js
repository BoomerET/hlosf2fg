/*jshint esversion: 6 */
/*jshint multistr: true */

/* 
    Fantasy Ground adaptation by David Berkompas
       Skype: david.berkompas
       Discord: BoomerET#2354
       Fantasy Grounds: BoomerET
       Github: https://github.com/BoomerET
       Reddit: https://www.reddit.com/user/BoomerET
       Roll20: https://app.roll20.net/users/9982/boomeret
       Paypal.me: https://paypal.me/boomeret
       (All contributions are donated to Hospice,
          or go here: https://www.hollandhospice.org/giving/donate-now/)
*/

var startXML = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n";
startXML += "<root version=\"4\" dataversion=\"20201016\" release=\"19|CoreRPG:4\">\n";
startXML += "\t<character>\n";

var endXML = "\t</character>\n</root>\n";
var allXML = "";

var pcFilename = "";

var object;

var charRaceText = "";
var charRaceType = "";
var littleTheme = "";

$(function() {
    dispLinks.init();
    clLinks.init();
    donateFGC.init();

    $("#Linkwindow").jqxWindow("close");
    $("#CLwindow").jqxWindow("close");
    $("#DONwindow").jqxWindow("close");
    //$("#grabChar").jqxButton({ width: "150px", height: "35px", theme: "darkblue" });
    $("#charInput").jqxTextArea({ theme: "darkblue", width: 750, height: 150, placeHolder: "Input Character JSON here." });
    $("#charOutput").jqxTextArea({ theme: "darkblue", width: 750, height: 150, placeHolder: "Character XML output appear here." });
    //$("#getcharID").jqxInput({ placeHolder: "Enter Character ID", height: "35px", width: 200, minLength: 4, theme: "darkblue"});
    $("#dlChar").jqxButton({ width: "120px", height: "35px", theme: "darkblue" });
    $("#parseChar").jqxButton({ width: "120px", height: "35px", theme: "darkblue" });
    $("#resetChar").jqxButton({ width: "120px", height: "35px", theme: "darkblue" });
    //$("#verButtonC").jqxRadioButton({width: 250, height: 25, checked: true, theme: "darkblue"});
    //$("#verButtonU").jqxRadioButton({width: 250, height: 25, theme: "darkblue"});
    $("#jqxMenu").jqxMenu({ width: 95, height: "145px", mode: "vertical", theme: "darkblue"});
    $("#jqxMenu").css("visibility", "visible");

    $('#extLinks').click(function(e) {
        e.preventDefault();
        $('#Linkwindow').jqxWindow('open');
    });
    $('#goHome').click(function(e) {
        e.preventDefault();
        window.location.reload(false);
    });
    $('#contactUs').click(function(e) {
        e.preventDefault();
        window.open("https://docs.google.com/forms/d/1OTSE0zUqEcq14Epyp73YVHM9AavhI0uvtH1NeoRoKiA/edit", "_blank");
    });
    $('#showChangelog').click(function(e) {
        e.preventDefault();
        $('#CLwindow').jqxWindow('open');
    });
    $('#showDonations').click(function(e) {
        e.preventDefault();
        $('#DONwindow').jqxWindow('open');
    });

    $('#grabChar').on("click", function() {
        if (fgVersion == 0) {
            if (confirm("You've selected to create a character for FG Classic. Is this correct?")){
                //
            } else {
                return(false);
            }
        } else {
            if (confirm("You've selected to create a character for FG Unity. Is this correct?")){
                //
            } else {
                return(false);
            }
        }
        if(!$('#getcharID').val().trim().match(/\d+/)) {
            alert("Um, please enter your Character ID");
        } else if ($('#textHere').val() != "")  {
            var resetMe = confirm("You need to clear previous data, do you want me to do that for you?");
            if (resetMe == 1) {
                window.location.reload(false);
            }
        } else {
            $.ajax({
                data: { charID:  $('#getcharID').val().trim() },
                url: 'scripts/getChar.php',
                method: 'GET',
                success: function(data) {
                    try {
                        parseCharacter($.parseJSON(data));
                    } catch(e) {
                        alert("Unable to parse character: " + $('#getcharID').val().trim());
                        console.error(e);
                        return;
                    }
                },
                failure: function(msg) {
                    alert("Unable to find character: " + $('#getcharID').val().trim());
                    return;
                }
            });
        }
    });

    $("#dlChar").on("click", function() {
        if ($("#textHere").val() == "") {
            alert("You need to load a character first.");
            return;
        }
        if (pcFilename == "" || pcFilename == null) {
            var ts = Math.round((new Date()).getTime() / 1000);
            pcFilename = ts + ".xml";
        } else {
            pcFilename += ".xml";
        }

        var textFile = new Blob([$("#charOutput").val()], {
            type: 'text/plain'
        });
        invokeSaveAsDialog(textFile, pcFilename);
    });

    $("#parseChar").on("click", function() {
        //console.log("Parsing character");
        var character = jQuery.parseJSON($("#charInput").val());
        parseCharacter(character);
        //$.each(character.actors, function(i, v) {
        //    console.log("Key: " + i + "; Value: " + v.gameValues.actRace);
        //});
    });

    $("#popCharID").on("change", function(event) {
        var firstNumber = event.args.item.label.indexOf("(");
        var secondNumber = event.args.item.label.indexOf(")");
        glCharID = event.args.item.label.substring(firstNumber + 1, secondNumber);
        $('#getcharID').val(glCharID);
    });

    $("#resetChar").on("click", function() {
        window.location.reload(false);
    });

    // fgVersion = 0: Classic; = 1: Unity
    $("#verButtonC").on('change', function (event) {
        var checked = event.args.checked;
        if (checked) {
            fgVersion = 0;
        } else {
            fgVersion = 1;
        }
    });
});

function parseCharacter(inputChar) {
    var character = jQuery.extend(true, {}, inputChar);
    var buildXML = startXML;
    
    $.each(character.actors, function(index, element) {
        buildXML += "\t\t<name type=\"string\">" + element.name + "</name>\n";
        pcFilename = element.name;
    });

    
    $.each(character.actors, function(i, v) {
        
        // Abilities
        buildXML += "\t\t<abilities>\n";
        $.each(v.items, function(j, w) {
            if (w.compset == "AbilScore") {
                buildXML += "\t\t\t<" + w.name.toLowerCase() + ">\n";
                buildXML += "\t\t\t\t<score type=\"number\">" + w.stNet + "</score>\n";
                if (w.hasOwnProperty("stAbScModifier")) {
                    buildXML += "\t\t\t\t<bonus type=\"number\">" + w.stAbScModifier + "</bonus>\n";
                } else {
                    buildXML += "\t\t\t\t<bonus type=\"number\">0</bonus>\n";
                }
                buildXML += "\t\t\t</" + w.name.toLowerCase() + ">\n";
            }
        });
        buildXML += "\t\t</abilities>\n";

        // Race
        $.each(v.gameValues, function(k, x) {
            if (k == "actTypeText") {
                charRaceText = x;
            } else if (k == "actRace") {
                charRaceType = x;
            }
        });
        buildXML += "\t\t<race type=\"string\">" + charRaceText + "</race>\n";
		buildXML += "\t\t<racelink type=\"windowreference\">\n";
		buildXML += "\t\t\t<class>race</class>\n";
		buildXML += "\t\t\t<recordname>reference.race." + charRaceType + "@*</recordname>\n";
        buildXML += "\t\t</racelink>\n";
        
        // Theme
        $.each(v.items, function(j, w) {
            if (w.compset == "Ability") {
                // Find theme knowledge to get Theme, abThemeKnowSpa.139
                var themeKnow = j.substring(0,11);
                if (themeKnow == "abThemeKnow") {
                    var thisTheme = j.substring(11,14);

                    switch(j.substring(11,14)) {
                        case "AcP":
                            buildXML += "\t\t<theme type=\"string\">Ace Pilot</theme>\n";
                            littleTheme = "acepilot";
                            break;
                        case "Bio":
                            buildXML += "\t\t<theme type=\"string\">Biotechnician</theme>\n";
                            littleTheme = "biotechnician";
                            break;
                        case "BoH":
                            buildXML += "\t\t<theme type=\"string\">Bounty Hunter</theme>\n";
                            littleTheme = "bountyhunter";
                            break;
                        case "CoA":
                            buildXML += "\t\t<theme type=\"string\">Corporate Agent</theme>\n";
                            littleTheme = "corporateagent";
                            break;
                        case "Cul":
                            buildXML += "\t\t<theme type=\"string\">Cultist</theme>\n";
                            littleTheme = "cultist";
                            break;
                        case "Cyb":
                            buildXML += "\t\t<theme type=\"string\">Cyberborn</theme>\n";
                            littleTheme = "cyberborn";
                            break;
                        case "DTo":
                            buildXML += "\t\t<theme type=\"string\">Death-Touched</theme>\n";
                            littleTheme = "deathtouched";
                            break;
                        case "Dra":
                            buildXML += "\t\t<theme type=\"string\">Dragonblood</theme>\n";
                            littleTheme = "dragonblood";
                            break;
                        case "DrP":
                            buildXML += "\t\t<theme type=\"string\">Dream Prophet</theme>\n";
                            littleTheme = "dreamprophet";
                            break;
                        case "Gla":
                            buildXML += "\t\t<theme type=\"string\">Gladiator</theme>\n";
                            littleTheme = "gladiator";
                            break;
                        case "Ico":
                            buildXML += "\t\t<theme type=\"string\">Icon</theme>\n";
                            littleTheme = "icon";
                            break;
                        case "Mer":
                            buildXML += "\t\t<theme type=\"string\">Mercenary</theme>\n";
                            littleTheme = "mercenary";
                            break;
                        case "Out":
                            buildXML += "\t\t<theme type=\"string\">Outlaw</theme>\n";
                            littleTheme = "outlaw";
                            break;
                        case "Pri":
                            buildXML += "\t\t<theme type=\"string\">Priest</theme>\n";
                            littleTheme = "priest";
                            break;
                        case "Rob":
                            buildXML += "\t\t<theme type=\"string\">Roboticist</theme>\n";
                            littleTheme = "roboticist";
                            break;
                        case "Sch":
                            buildXML += "\t\t<theme type=\"string\">Scholar</theme>\n";
                            littleTheme = "scholar";
                            break;
                        case "SoD":
                            buildXML += "\t\t<theme type=\"string\">Solar Disciple</theme>\n";
                            littleTheme = "solardisciple";
                            break;
                        case "SPi":
                            buildXML += "\t\t<theme type=\"string\">Space Pirate</theme>\n";
                            littleTheme = "spacepirate";
                            break;
                        case "Spa":
                            buildXML += "\t\t<theme type=\"string\">Spacefarer</theme>\n";
                            littleTheme = "spacefarer";
                            break;
                        case "TeP":
                            buildXML += "\t\t<theme type=\"string\">Tempered Pilgrim</theme>\n";
                            littleTheme = "temperedpilgrim";
                            break;
                        case "WiW":
                            buildXML += "\t\t<theme type=\"string\">Wild Warden</theme>\n";
                            littleTheme = "wildwarden";
                            break;
                        case "Xna":
                            buildXML += "\t\t<theme type=\"string\">Xenoarchaeologist</theme>\n";
                            littleTheme = "xenoarchaeologist";
                            break;
                        case "Xen":
                            buildXML += "\t\t<theme type=\"string\">Xenoseeker</theme>\n";
                            littleTheme = "xenoseeker";
                            break;
                        default:
                            buildXML += "\t\t<theme type=\"string\">Themeless</theme>\n";
                            littleTheme = "themeless";
                    }
                }
            }
        });
        buildXML += "\t\t<theme type=\"string\">" + fullTheme + "</theme>\n";
        buildXML += "\t\t<themelink type=\"windowreference\">\n";
        buildXML += "\t\t\t<class>theme</class>\n";
        buildXML += "\t\t\t<recordname>reference.theme." + littleTheme + "@*</recordname>\n";
        buildXML += "\t\t</themelink>\n";
        buildXML += "\t\t<themerecord type=\"string\">reference.theme." + littleTheme + "@*</themerecord>\n";

        // Class
        buildXML += "\t\t<classes>\n";
        classCount = 1;
        $.each(v.items, function(j, w) {
            if (w.compset == "Class") {
                thisIteration = pad(classCount, 5);
                
                buildXML += "\t\t\t<id-" + thisIteration + ">\n";
                var getArchetype = w.name.split("(")[1].split(")")[0];
                var charClass = w.name.split("(")[0].trim();
                var smallCharClass = charClass.toLowerCase().replace(/[ _-]/g, '');
                //console.log("Class reference: " + smallCharClass);
                
                buildXML += "\t\t\t\t<archetype type=\"string\">" + getArchetype + "</archetype>\n";

                buildXML += "\t\t\t\t<archetypelink type=\"windowreference\">\n";
                buildXML += "\t\t\t\t\<class>archetype</class>\n";
                buildXML += "\t\t\t\t\t<recordname>reference.archetype." + getArchetype.toLowerCase().replace(/[ _-]/g, '') + "@*</recordname>\n";
                buildXML += "\t\t\t\t</archetypelink>\n";


                buildXML += "\t\t\t\t<name type=\"string\">" + charClass + "</name>\n";
                buildXML += "\t\t\t\t<level type=\"number\">" + w.clLevelNet + "</level>\n";
                buildXML += "\t\t\t\t<shortcut type=\"windowreference\">\n";
                buildXML += "\t\t\t\t\t<class>class</class>\n";
                buildXML += "\t\t\t\t\t<recordname>reference.class." + smallCharClass + "@*</recordname>\n";
                buildXML += "\t\t\t\t</shortcut>\n";

                switch(smallCharClass) {
                    case "envoy":
                        buildXML += "\t\t\t\t<classkey type=\"string\">Charisma</classkey>\n";
                        break;
                    case "mechanic":
                        buildXML += "\t\t\t\t<classkey type=\"string\">Intelligence</classkey>\n";
                        break;
                    case "mystic":
                        buildXML += "\t\t\t\t<classkey type=\"string\">Wisdom</classkey>\n";
                        break;
                    case "operative":
                        buildXML += "\t\t\t\t<classkey type=\"string\">Dexterity</classkey>\n";
                        break;
                    case "solarian":
                        buildXML += "\t\t\t\t<classkey type=\"string\">Charisma</classkey>\n";
                        break;
                    case "soldier":
                        buildXML += "\t\t\t\t<classkey type=\"string\">Strength</classkey>\n";
                        break;
                    case "technomancer":
                        buildXML += "\t\t\t\t<classkey type=\"string\">Intelligence</classkey>\n";
                        break;
                    default:
                        buildXML += "\t\t\t\t<classkey type=\"string\">None</classkey>\n";
                }

                buildXML += "\t\t\t</id-" + thisIteration + ">\n";
                classCount += 1;
            }
        });
        buildXML += "\t\t</classes>\n";

        // Skills
        totalSkills = 1;
        $.each(v.items, function(j, w) {
            if (w.compset == "Skill") {
                thisIteration = pad(totalSkills, 5);
                buildXML += "\t\t\t<id-" + thisIteration + ">\n";

                buildXML += "\t\t\t\t<label type=\"string\">" + w.name + "</label>\n";
                buildXML += "\t\t\t\t<ranks type=\"number\">" + w.skRanks + "</ranks>\n";
                buildXML += "\t\t\t\t<total type=\"number\">" + w.stNet + "</total>\n";

                buildXML += "\t\t\t</id-" + thisIteration + ">\n";
            }
        });
    });

    buildXML += endXML;
    $('#charOutput').val(buildXML);
}

const getObjects = function(obj, key, val) {
    var objects = [];
    for (var i in obj) {
        if (!obj.hasOwnProperty(i)) continue;
        if (typeof obj[i] == 'object') {
            objects = objects.concat(getObjects(obj[i], key, val));
        } else
        if (i == key && obj[i] == val || i == key && val == '') { //
            objects.push(obj);
        } else if (obj[i] == val && key == ''){
            if (objects.lastIndexOf(obj) == -1){
                objects.push(obj);
            }
        }
    }
    return objects;
};

function replaceDash(str) {
    firstStep = str.replace(/-/g, "_");
    return firstStep.replace(/\s/g, "_");
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function pad(num, size) {
    var s = num + "";

    while (s.length < size) s = "0" + s;
    return s;
}

function invokeSaveAsDialog(file, fileName) {
    if (!file) {
        throw 'Blob object is required.';
    }

    if (!file.type) {
        file.type = 'video/webm';
    }

    var fileExtension = file.type.split('/')[1];

    if (fileName && fileName.indexOf('.') !== -1) {
        var splitted = fileName.split('.');
        fileName = splitted[0];
        fileExtension = splitted[1];
    }

    var fileFullName = (fileName || (Math.round(Math.random() * 9999999999) + 888888888)) + '.' + fileExtension;

    if (typeof navigator.msSaveOrOpenBlob !== 'undefined') {
        return navigator.msSaveOrOpenBlob(file, fileFullName);
    } else if (typeof navigator.msSaveBlob !== 'undefined') {
        return navigator.msSaveBlob(file, fileFullName);
    }

    var hyperlink = document.createElement('a');
    hyperlink.href = URL.createObjectURL(file);
    hyperlink.target = '_blank';
    hyperlink.download = fileFullName;

    if (!!navigator.mozGetUserMedia) {
        hyperlink.onclick = function() {
            (document.body || document.documentElement).removeChild(hyperlink);
        };
        (document.body || document.documentElement).appendChild(hyperlink);
    }

    var evt = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
    });

    hyperlink.dispatchEvent(evt);

    if (!navigator.mozGetUserMedia) {
        URL.revokeObjectURL(hyperlink.href);
    }
}

function fixQuote(badString) {
    if(badString == "" || badString == null) {
        return "";
    }
    return badString.replace(/\n/g, '\n').replace(/\u2019/g, "'").replace(/\u2014/g, "-").replace(/"/g, "&#34;").replace(/\u2022/g, ":").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/&nbsp;/g, " ").replace(/&rsquo;/g, "'").replace(/\s&/g, "&amp;").trim();
}

// Need two, one for FGC, another for FGU
function fixDesc(badString) {
    if(badString == "" || badString == null) {
        return "";
    }
    if (fgVersion == 0) {
        // FG Classic
        var tempString1 = badString.replace(/<a\s.*?\">/g, "").replace(/<\/a>/g, "").replace(/<\/span>/g, "").replace(/’/g, "'").replace(/—/g, "-");
    } else {
        // FG Unity
        var tempString1 = badString.replace(/<a\s.*?\">/g, "").replace(/<\/a>/g, "").replace(/<\/span>/g, "");
    }
    
    var tempString2 = tempString1.replace(/<img.*?">/g, "").replace(/<hr>/g, "<hr />").replace(/<span>/g, "");
    var tempString3 = tempString2.replace(/<br>/g, "<br />").replace(/&rsquo;/g, "'").replace(/&nbsp;/g, " ");
    var tempString4 = tempString3.replace(/&ldquo;/g, '"').replace(/<span\s.*?">/g, "").replace(/<em>/g, "").replace(/<\/em>/g, "")
    return tempString4.replace(/&rdquo;/g, '"').replace(/&mdash;/g, "-").replace(/&times;/g, "*").replace(/&minus;/g, "-").trim();
}

function convert_case(str) {
    var lower = str.toLowerCase();
    return lower.replace(/(^|\s)(w)/g, function(x) {
        return x.toUpperCase();
    });
}

function remove_tags_traits(badString) {
    var tempString1 = badString.replace(/&lt;/g, "<").replace(/&gt;/g, ">");
    var tempString2 = tempString1.replace(/&rsquo;/g, "'").replace(/&lsquo;/g, "'").replace(/&rdquo;/g, "\"").replace(/&ldquo;/g, "\"");
    var tempString3 = tempString2.replace(/&#34;/g, "\"").replace(/<br>/g, "<br />").replace(/&ndash;/g, "-");
    var tempString4 = tempString3.replace(/<th\sstyle/g, "<td style").replace(/<\/th>/g, "</td>").replace(/<th\srowspan/g, "<td rowspan").replace(/<th\scolspan/g, "<td colspan").replace(/<th>/g, "<td>");
    var tempString5 = tempString4.replace(/<span>/g, "").replace(/<\/span>/g, "").replace(/<span\sstyle\="font-weight\:400">/g, "");
    var tempString6 = tempString5.replace(/&nbsp;/g, " ").replace(/<br>/g, "\n").replace(/<h5>/g, "<p><b>").replace(/<\/h5>/g, "</b></p>").replace(/<span\sstyle\="color\:#[a-zA-Z0-9]{3}">/g, "").replace(/<span\sstyle\="color\:#[a-zA-Z0-9]{6}">/g, "");

    return tempString6;
}

var dispLinks = (function () {
    function _createLinks() {
        var userLinks = $('#displayLinks');
        var offset = userLinks.offset();
        $('#Linkwindow').jqxWindow({
            position: { x: 150, y: 150} ,
            theme: 'darkblue',
            isModal: true,
            showCollapseButton: true, maxHeight: 400, maxWidth: 700, minHeight: 200, minWidth: 200, height: 300, width: 500,
            initContent: function () {
                $('#Linkwindow').jqxWindow('focus');
            }
        });
    }
    return {
        config: {
            dragArea: null
        },
        init: function () {
            _createLinks();
        }
    };
} ());

var clLinks = (function () {
    function _createCL() {
        var userCL = $('#displayCL');
        var offset = userCL.offset();
        $('#CLwindow').jqxWindow({
            position: { x: 150, y: 50},
            theme: 'darkblue',
            showCollapseButton: true,
            maxWidth: 700, 
            minWidth: 200, 
            height: 450, 
            width: 500, 
            resizable: true,
            isModal: true,
            initContent: function () {
                $('#CLwindow').jqxWindow('focus');
            }
        });
    }
    return {
        config: {
            dragArea: null
        },
        init: function () {
            _createCL();
        }
    };
} ());

var donateFGC = (function () {
    function _createDon() {
        var userDon = $('#displayDon');
        var offset = userDon.offset();
        $('#DONwindow').jqxWindow({
            position: { x: 150, y: 150} ,
            theme: 'darkblue',
            isModal: true,
            showCollapseButton: true, maxHeight: 400, maxWidth: 700, minHeight: 200, minWidth: 200, height: 300, width: 500, 
            initContent: function () {
                $('#DONwindow').jqxWindow('focus');
            }
        });
    }
    return {
        config: {
            dragArea: null
        },
        init: function () {
            _createDon();
        }
    };
} ());
