define([
  "dojo/_base/declare",
  "esri/Graphic",
  "esri/geometry/Extent",
  "esri/geometry/Point",
  "esri/symbols/PictureMarkerSymbol",
  "esri/PopupTemplate"
], function (declare, Graphic, Extent, Point, PictureMarkerSymbol, PopupTemplate) {

  return declare(null, {
    getFeatures: function (pt) {

      var currentPoint = pt || new Point({
        "x": -8576663.077462012,
        "y": 4705329.594466476,
        "spatialReference": {
          "wkid": 102100
        }
      });

      return [new Graphic({
        geometry: currentPoint,
        attributes: {
          title: "Route Inspection 3",
          description: "Aut ut odio unde porro in. Aut fuga magni adipisci. Recusandae ipsum distinctio omnis ut illum. Quo inventore facere suscipit quis quibusdam qui. Iure eum cupiditate sint laudantium et molestiae. Alias tempore eos deleniti. Veniam maiores aut ducimus accusantium. Vel inventore tempora tempore libero possimus quae magni sunt. Molestiae placeat sed a porro et quod. Nihil magnam aut ut id. Doloribus quia exercitationem veniam repellendus dolorum.",
          tacos: 3.13439834,
          burritos: 1,
          quesadillas: 2,
          ImageUrl: "http://placekitten.com/408/287",
          ImageUrl2: "http://placekitten.com/600/425",
          ImageUrl3: "http://placekitten.com/350/200",
          ImageUrl4: "http://placekitten.com/500/375",
          ImageUrl5: "http://placekitten.com/375/225"
        },
        symbol: new PictureMarkerSymbol({
          url: "http://placekitten.com/g/200/300",
          width: 16,
          height: 16
        }),
        popupTemplate: new PopupTemplate({
          content: [
            {
              type: "attachments",
              "attachmentInfos": [
                {
                  "name": "Unacceptable_Report_Yellow.gif",
                  "url": "http://i.imgur.com/wozrf9S.gif"
              },
                {
                  "name": "Thisisanacceptableattachmenttitleeventthoughitisreallylong.jpg",
                  "url": "http://i.kinja-img.com/gawker-media/image/upload/s--2mHwx0dI--/1381336939131719823.jpg"
              },
                {
                  "name": "Safety_Report_221901_hold.gif",
                  "url": "http://38.media.tumblr.com/19724b355cb9a5aa918eed4e18f83361/tumblr_n9ghp2P3hV1qb70nio1_500.gif"
              }
              ]
            },
            {
              type: "media",
              title: "The Cat",
              "mediaInfos": [{
                "title": "Single Catface",
                "type": "image",
                "caption": "This catface is all alone without an anchor.",
                "value": {
                  "sourceURL": "{ImageUrl}"
                    /*,
                                      "linkURL": "http://www.esri.com/"*/
                },
                "_visible": true,
                "_pos": 0,
                "_displayTitle": 1
            }]
          }, {
              type: "text",
              text: "There were precisely {tacos:NumberFormat(places:5)} tacos eaten by the cat."
          }, {
              type: "fields",
              fieldInfos: [{
                "fieldName": "title",
                "label": "My Title",
                "isEditable": true,
                "tooltip": "",
                "visible": true,
                "stringFieldOption": "textbox"
      }, {
                "fieldName": "description",
                "label": "Summary",
                "isEditable": true,
                "tooltip": "",
                "visible": true,
                "stringFieldOption": "textbox"
      }, {
                "fieldName": "ImageUrl",
                // "label": "ImageUrl Title",
                "isEditable": true,
                "tooltip": "",
                "visible": true,
                "stringFieldOption": "textbox"
      }, {
                "fieldName": "tacos",
                "label": "Number of tacos",
                "isEditable": false,
                "tooltip": "",
                "visible": true,
                "format": {
                  "places": 3,
                  "digitSeparator": true
                },
                "stringFieldOption": "textbox"
      }, {
                "fieldName": "burritos",
                "label": "Number of burritos",
                "isEditable": false,
                "tooltip": "",
                "visible": true,
                "format": {
                  "places": 0,
                  "digitSeparator": true
                },
                "stringFieldOption": "textbox"
      }, {
                "fieldName": "quesadillas",
                "label": "Number of quesadillas",
                "isEditable": false,
                "tooltip": "",
                "visible": true,
                "format": {
                  "places": 0,
                  "digitSeparator": true
                },
                "stringFieldOption": "textbox"
      }]

          }, {
              type: "media",
              "mediaInfos": [{
                "title": "Catface with Friends",
                "type": "image",
                "caption": "This cat has other cats and a pie.",
                "value": {
                  "sourceURL": "{ImageUrl}",
                  "linkURL": "http://www.esri.com/"
                },
                "_visible": true,
                "_pos": 0,
                "_displayTitle": 1
            }, {
                "title": "test 2",
                "type": "image",
                "caption": "bleh bleh",
                "value": {
                  "sourceURL": "{ImageUrl2}",
                  "linkURL": "http://www.esri.com/"
                },
                "_visible": true,
                "_pos": 0,
                "_displayTitle": 1
            }, {
                "title": "test 3",
                "type": "image",
                "caption": "blah blah",
                "value": {
                  "sourceURL": "{ImageUrl3}",
                  "linkURL": "http://www.esri.com/"
                },
                "_visible": true,
                "_pos": 0,
                "_displayTitle": 1
            }, {
                "title": "test 4",
                "type": "image",
                "caption": "testing",
                "value": {
                  "sourceURL": "{ImageUrl4}",
                  "linkURL": "http://www.esri.com/"
                },
                "_visible": true,
                "_pos": 0,
                "_displayTitle": 1
            }, {
                "title": null,
                "type": "image",
                "caption": "testing caption only",
                "value": {
                  "sourceURL": "{ImageUrl5}",
                  "linkURL": "http://www.esri.com/"
                },
                "_visible": true,
                "_pos": 0,
                "_displayTitle": 1
            }, {
                "title": null,
                "type": "pie-chart",
                "caption": "haha",
                "value": {
                  "fields": ["burritos", "tacos", "quesadillas"]
                }
      }]
          }],


          title: "{title}",
          actions: [{
              title: "Do it {tacos} {burritos} {quesadillas} {nothing}",
              id: "shia",
              className: "shia"
            }
              /*,{
                            title: "Hello World 2",
                            image: "http://findicons.com/files/icons/2166/oxygen/22/face_smile.png",
                            action: function(){ alert("test 2") }
                          }*/
              ],
          overwriteActions: false,
          "fieldInfos": [{
            "fieldName": "title",
            "label": "title",
            "isEditable": true,
            "tooltip": "",
            "visible": true,
            "stringFieldOption": "text-box"
      }, {
            "fieldName": "description",
            "label": "description",
            "isEditable": true,
            "tooltip": "",
            "visible": true,
            "stringFieldOption": "text-box"
      }, {
            "fieldName": "ImageUrl",
            "label": "ImageUrl",
            "isEditable": true,
            "tooltip": "",
            "visible": true,
            "stringFieldOption": "text-box"
      }, {
            "fieldName": "ImageUrl2",
            "label": "ImageUrl2",
            "isEditable": true,
            "tooltip": "",
            "visible": true,
            "stringFieldOption": "text-box"
      }, {
            "fieldName": "ImageUrl3",
            "label": "ImageUrl3",
            "isEditable": true,
            "tooltip": "",
            "visible": true,
            "stringFieldOption": "text-box"
      }, {
            "fieldName": "tacos",
            "label": "Number of tacos",
            "isEditable": false,
            "tooltip": "",
            "visible": true,
            "format": {
              "places": 0,
              "digitSeparator": true
            },
            "stringFieldOption": "text-box"
      }, {
            "fieldName": "burritos",
            "label": "Number of burritos",
            "isEditable": false,
            "tooltip": "",
            "visible": true,
            "format": {
              "places": 0,
              "digitSeparator": true
            },
            "stringFieldOption": "text-box"
      }, {
            "fieldName": "quesadillas",
            "label": "Number of quesadillas",
            "isEditable": false,
            "tooltip": "",
            "visible": true,
            "format": {
              "places": 0,
              "digitSeparator": true
            },
            "stringFieldOption": "text-box"
      }]
        })
      }), new Graphic({
        geometry: new Point({
          "x": -8576663.077462012,
          "y": 4705329.594466476,
          "spatialReference": {
            "wkid": 102100
          }
        }),
        attributes: {
          title: "Route Inspection",
          description: "test 1"
        },
        symbol: new PictureMarkerSymbol({
          url: "https://cdn0.iconfinder.com/data/icons/small-n-flat/24/678111-map-marker-128.png",
          width: 16,
          height: 16
        }),
        popupTemplate: new PopupTemplate({
          content: "{description}",
          title: "{title}"
        })
      }), new Graphic({
        geometry: new Point({
          "x": -8572667.077462012,
          "y": 4705830.594466476,
          "spatialReference": {
            "wkid": 102100
          }
        }),
        attributes: {
          title: "Route Inspection 2",
          description: "test 2"
        },
        symbol: new PictureMarkerSymbol({
          url: "https://cdn0.iconfinder.com/data/icons/small-n-flat/24/678111-map-marker-128.png",
          width: 16,
          height: 16
        }),
        popupTemplate: new PopupTemplate({
          content: "{description}",
          title: "{title}"
        })
      })];
    }
  });

});
