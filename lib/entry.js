/**
 * InfraNodus is a lightweight interface to graph databases.
 *
 * This open source, free software is available under MIT license.
 * It is provided as is, with no guarantees and no liabilities.
 * You are very welcome to reuse this code if you keep this notice.
 *
 * Written by Dmitry Paranyushkin | Nodus Labs, you, you and you!
 * www.noduslabs.com | info AT noduslabs DOT com
 *
 * In some parts the code from the book "Node.js in Action" is used,
 * (c) 2014 Manning Publications Co.
 *
 */

var redis = require('redis');
var db = redis.createClient();
var neo4j = require('node-neo4j');
dbneo = new neo4j('http://localhost:7474');
var CypherQuery = require('./db/neo4j');
var Instruments = require('./tools/instruments.js');

module.exports = Entry;

function Entry(obj) {
    for (var key in obj) {
        this[key] = obj[key];
    }
}

/*Entry.prototype.save = function(fn){
    var entryJSON = JSON.stringify(this);

    db.lpush(
        'entries',
        entryJSON,
        function(err) {
            if (err) return fn(err);
            fn();
        }
    );
};     */

Entry.prototype.save = function(fn){


    // TODO Make it set up automatically later for each user
    var context = {
        name: "Sandbox",
        uid: "cc5c4320-927e-11e3-a139-9331f538c999"
    }

    // Pass on the user parameters
    var user = {
        name: this.by_name,
        uid: this.by_uid
    };

    // Set up UID for the statement
    var uuid = require('node-uuid');
    var statement_uid = uuid.v1();

    // Pass on statement parameters
    var statement = {
        text: this.text,
        uid: statement_uid
    };

    // Pass on the hashtags we got from Statement with validate.js
    var hashtags = this.hashtags;

    // Construct a query using the data we have so far
    CypherQuery.addStatement(user,hashtags,statement,context, function(cypherRequest) {

        console.log(cypherRequest);

        // Make the query itself

        dbneo.cypherQuery(cypherRequest, function(err, cypherAnswer){
            if(err) throw err;

            console.log("Return info: " + cypherAnswer);

            fn(null,cypherAnswer);

        });
    });

    // Continue




}

// TODO add a parameter in getRange which would tell the function what information to query

Entry.getRange = function(origin, fn){

    /*
    db.lrange('entries', from, to, function(err, items){
        if (err) return fn(err);
        var entries = [];

        items.forEach(function(item){
            entries.push(JSON.parse(item));
        });

        fn(null, entries);
    });  */



     console.log("Retrieving statements for User UID: " + origin);

     dbneo.cypherQuery("MATCH (u:User{uid:'" + origin + "'}), (s:Statement), s-[rel:BY]->u RETURN s ORDER BY rel.timestamp DESC;", function(err, statements){
            if(err) throw err;

            console.log(statements);

            fn(null,statements.data);

     });


     // TODO 1. GET ALL THE NODES FOR THE USER AS JSON (CHECK WHAT SIGMA NEEDS) AND VISUALIZE THEM
     // sandbox.ejs already has all the necessary settings, short.json is an example of a file.
     // perhaps eventually i should build a constructor that feeds the nodes and edges to G property of the graph instead of creating json

     // TODO 2. WHEN A NODE IS CLICKED, THE STATEMENTS ON THE LEFT ARE FILTERED ACCORDINGLY
     // think of a library like angular to use for that


};


Entry.getNodes = function(origin, fn){



    console.log("Retrieving nodes for User UID: " + origin);

    dbneo.cypherQuery("MATCH (u:User{uid:'" + origin + "'}), (c1:Concept), (c2:Concept), c1-[:BY]->u, c2-[:BY]->u, c1-[rel:TO]->c2 RETURN c1.uid AS source_id,c1.name AS source_target,c2.uid AS target_id,c2.name AS target_name,rel.uid AS edge_id;", function(err, nodes){
        if(err) throw err;

        var nodes_object = nodes.data;

        var g = {
            nodes: [],
            edges: []
        };

        for (var i = 0; i < nodes_object.length; i++) {

            g.nodes.push({
                id: nodes_object[i][0],
                label: nodes_object[i][1]
            });

            g.nodes.push({
                id: nodes_object[i][2],
                label: nodes_object[i][3]
            });

            g.edges.push({
                source: nodes_object[i][0],
                target: nodes_object[i][2],
                id: nodes_object[i][4]
            });

        };

        g.nodes = Instruments.uniqualizeArray(g.nodes, JSON.stringify);
        g.edges = Instruments.uniqualizeArray(g.edges, JSON.stringify);


        fn(null,g);

    });


    // TODO 1. GET ALL THE NODES FOR THE USER AS JSON (CHECK WHAT SIGMA NEEDS) AND VISUALIZE THEM
    // sandbox.ejs already has all the necessary settings, short.json is an example of a file.
    // perhaps eventually i should build a constructor that feeds the nodes and edges to G property of the graph instead of creating json

    // TODO 2. WHEN A NODE IS CLICKED, THE STATEMENTS ON THE LEFT ARE FILTERED ACCORDINGLY
    // think of a library like angular to use for that


};