const { WebClient } = require("@slack/web-api");
const util = require("util");
var cluster = require("set-clustering");
const { X_OK } = require("constants");

require("dotenv").config();

// Read a token from the environment variables
const token = process.env.SLACK_TOKEN;

// Initialize
const web = new WebClient(token);

function checkDinoPoll(message) {
  return message.user == "U01RR8KDEPQ";
}

function checkOption(block) {
  const result =
    typeof block.text != "undefined"
      ? block.text.text.split("_(").length > 1
      : false;
  return result;
}

async function main() {
  let messages = [];
  console.log("hi");
  // Async iteration is similar to a simple for loop.
  // Use only the first two parameters to get an async iterator.
  for await (const page of web.paginate("conversations.history", {
    channel: "C01U8UCHZC1",
  })) {
    messages = messages.concat(page.messages);
  }
  messages = messages.filter(checkDinoPoll);

  messages = messages.map((message) => ({
    results: message.blocks.filter(checkOption).map((block) => ({
      tag: block.text.text.split("_(")[0].trim(),
      voters: block.text.text.split("_(")[1].split("\n")[1].split(", "),
    })),
  }));

  let people = {};

  messages.map((message) => {
    message.results.map((area) => {
      area.voters.map((voter) => {
        if (typeof people[voter] == "undefined") {
          people[voter] = [area.tag];
        } else {
          people[voter] = people[voter].concat([area.tag]);
        }
      });
    });
  });
  let peopleArray = Object.entries(people).map((person) => ({
    id: person[0],
    votes: person[1],
  }));

  let relationships = {};

  function similarity(x, y) {
    var score = 0;
    x.votes.forEach(function (tx) {
      y.votes.forEach(function (ty) {
        if (tx == ty) score += 1;
      });
    });
    if (y.id != "" && x.id != "") {
      if (typeof relationships[x.id] == "undefined") {
        relationships[x.id] = [{ id: y.id, score: score / y.votes.length }];
      } else {
        relationships[x.id] = relationships[x.id].concat([
          { id: y.id, score: score / y.votes.length },
        ]);
      }
    }
    return score;
  }

  cluster(peopleArray, similarity);

  //console.log(c.groups(peopleArray.length / 2))
  // console.log(util.inspect(messages, { showHidden: false, depth: null }));
  console.log(relationships);

  

  let relationshipsArray = Object.entries(relationships).map((person) => ({
    id: person[0],
    relationships: person[1],
  }));

  for(x in relationshipsArray) {
    relationshipsArray[x]['info'] = await web.users.info({user: relationshipsArray[x]['id'].replace('<@', '').replace('>', '')})
    relationshipsArray[x]['info'] = {
      avatar: relationshipsArray[x].info.user.profile.image_192,
      name: relationshipsArray[x].info.user.profile.display_name
    }
  }
  console.log(relationshipsArray)
 // console.log(util.inspect(relationshipsArray, { showHidden: false, depth: null }));
}

main();
