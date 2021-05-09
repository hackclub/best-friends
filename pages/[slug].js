import { Container, Heading, Text, Box, Flex, Link, Card } from 'theme-ui'
import SelectSearch, { fuzzySearch } from 'react-select-search/dist/cjs'
import { useRouter } from 'next/router'

export default function App({ finalResults, slugs, options, error }) {
  const router = useRouter()
  if (notFound) {
    return <Error statusCode={'404'} />
  }
  if (router.isFallback) {
    return <div>Loading...</div>
  }
  function renderFriend(props, option, snapshot, className) {
    const imgStyle = {
      borderRadius: '50%',
      verticalAlign: 'middle',
      marginRight: 10
    }

    

    return (
      <button
        onClick={() => router.push(`/${option.slug}`)}
        onMouseEnter={() => router.prefetch(`/${option.slug}`)}
        className={className}
        type="button"
      >
        <span>
          <img
            alt=""
            style={imgStyle}
            width="32"
            height="32"
            src={option.avatar}
          />
          <span>{option.name}</span>
        </span>
      </button>
    )
  }
  return (
    <Container>
      <Flex sx={{ minHeight: '100vh', pt: '80px' }}>
        <Box sx={{ maxWidth: '75%' }}>
          <Heading as="h1" sx={{ marginLeft: '8px' }}>
            {finalResults.me.name}'s new Hack Club best friend is:
          </Heading>
          <Heading sx={{ fontSize: '7em' }}>
            <img
              src={finalResults.first.userInfo.avatar}
              style={{
                height: '1em',
                verticalAlign: 'text-bottom',
                borderRadius: '16px',
                marginRight: '16px'
              }}
            />
            <Text sx={t => t.util.gxText('red', 'orange')}>
              {finalResults.first.userInfo.name}
            </Text>
          </Heading>
          {typeof finalResults.second != 'undefined' ? (
            <>
              <Box sx={{ my: '0.83em' }}>
                {finalResults.me.name} may also be friends with:
                <Card
                  sx={{
                    borderRadius: '4px',
                    p: ['8px', '8px'],
                    py: ['4px', '4px'],
                    pt: ['2px', '2px'],
                    fontSize: '1.3em',
                    my: '0.43em'
                  }}
                >
                  <img
                    src={finalResults.second.userInfo.avatar}
                    style={{
                      height: '1em',
                      verticalAlign: 'text-bottom',
                      borderRadius: '4px',
                      marginRight: '6px'
                    }}
                  />
                  <Text>{finalResults.second.userInfo.name}</Text>
                </Card>
                {typeof finalResults.third != 'undefined' ? (
                  <Card
                    sx={{
                      borderRadius: '4px',
                      p: ['8px', '8px'],
                      py: ['4px', '4px'],
                      pt: ['2px', '2px'],
                      fontSize: '1.3em',
                      my: '0.43em'
                    }}
                  >
                    <img
                      src={finalResults.third.userInfo.avatar}
                      style={{
                        height: '1em',
                        verticalAlign: 'text-bottom',
                        borderRadius: '4px',
                        marginRight: '6px'
                      }}
                    />
                    <Text>{finalResults.third.userInfo.name}</Text>
                  </Card>
                ) : (
                  ''
                )}
                {typeof finalResults.fourth != 'undefined' ? (
                  <Card
                    sx={{
                      borderRadius: '4px',
                      p: ['8px', '8px'],
                      py: ['4px', '4px'],
                      pt: ['2px', '2px'],
                      fontSize: '1.3em',
                      my: '0.43em'
                    }}
                  >
                    <img
                      src={finalResults.fourth.userInfo.avatar}
                      style={{
                        height: '1em',
                        verticalAlign: 'text-bottom',
                        borderRadius: '4px',
                        marginRight: '6px'
                      }}
                    />
                    <Text>{finalResults.fourth.userInfo.name}</Text>
                  </Card>
                ) : (
                  ''
                )}
              </Box>
            </>
          ) : (
            ''
          )}
          <Box sx={{ marginTop: '-0.83em', color: 'muted' }}>
            ----------------
          </Box>
          <SelectSearch
            renderOption={renderFriend}
            search
            placeholder="Find someone else"
            filterOptions={fuzzySearch}
            options={slugs}
          />
          <Box sx={{ marginTop: '0.83em', color: 'muted' }}>
            Can't find yourself? Participate in{' '}
            <Link
              href="https://hackclub.slack.com/archives/C01U8UCHZC1/"
              sx={{ color: 'grey' }}
            >
              #poll-of-the-day
            </Link>{' '}
            to join the list.
          </Box>
        </Box>
      </Flex>
      <style>{`
      .select-search__input {
        padding: 8px!important
      }
      `}</style>
    </Container>
  )
}

export async function getStaticPaths() {
  const { WebClient } = require('@slack/web-api')
  var cluster = require('set-clustering')
  var GithubSlugger = require('github-slugger')

  const token = process.env.SLACK_TOKEN

  const web = new WebClient(token)

  function checkDinoPoll(message) {
    return message.user == 'U01RR8KDEPQ'
  }

  function checkOption(block) {
    const result =
      typeof block.text != 'undefined'
        ? block.text.text.split('_(').length > 1
        : false
    return result
  }
  let messages = []

  for await (const page of web.paginate('conversations.history', {
    channel: 'C01U8UCHZC1'
  })) {
    messages = messages.concat(page.messages)
  }
  messages = messages.filter(checkDinoPoll)

  messages = messages.map(message => ({
    results: message.blocks.filter(checkOption).map(block => ({
      tag: block.text.text.split('_(')[0].trim(),
      voters: block.text.text.split('_(')[1].split('\n')[1].split(', ')
    }))
  }))

  let people = {}

  messages.map(message => {
    message.results.map(area => {
      area.voters.map(voter => {
        if (typeof people[voter] == 'undefined') {
          people[voter] = [area.tag]
        } else {
          people[voter] = people[voter].concat([area.tag])
        }
      })
    })
  })
  let peopleArray = Object.entries(people).map(person => ({
    id: person[0],
    votes: person[1]
  }))

  let relationships = {}

  function similarity(x, y) {
    var score = 0
    x.votes.forEach(function (tx) {
      y.votes.forEach(function (ty) {
        if (tx == ty) score += 1
      })
    })
    if (y.id != '' && x.id != '') {
      if (typeof relationships[x.id] == 'undefined') {
        relationships[x.id] = [{ id: y.id, score: score / y.votes.length }]
      } else {
        relationships[x.id] = relationships[x.id].concat([
          { id: y.id, score: score / y.votes.length }
        ])
      }
    }

    return score
  }

  cluster(peopleArray, similarity)

  let relationshipsArray = Object.entries(relationships).map(person => ({
    id: person[0],
    relationships: person[1]
  }))

  for (let x in relationshipsArray) {
    relationshipsArray[x]['info'] = await web.users.info({
      user: relationshipsArray[x]['id'].replace('<@', '').replace('>', '')
    })
    relationshipsArray[x]['info'] = {
      avatar: relationshipsArray[x].info.user.profile.image_192,
      name: relationshipsArray[x].info.user.profile.display_name
    }
  }

  var slugger = new GithubSlugger()

  let slugs = relationshipsArray.map(x => ({
    params: { slug: slugger.slug(x.info.name) }
  }))

  let slugs1 = relationshipsArray.map(x => ({
    slug: slugger.slug(x.info.name),
    name: x.info.name,
    avatar: x.info.avatar
  }))

  let options = slugs1.map(x => ({
    value: x.slug,
    name: x.name,
    photo: x.avatar
  }))
  console.log(slugs)
  return { paths: slugs, fallback: true }
}

export async function getStaticProps({ params }) {
  try {
    const { WebClient } = require('@slack/web-api')
    var cluster = require('set-clustering')
    var GithubSlugger = require('github-slugger')

    const token = process.env.SLACK_TOKEN

    const web = new WebClient(token)

    function checkDinoPoll(message) {
      return message.user == 'U01RR8KDEPQ'
    }

    function checkOption(block) {
      const result =
        typeof block.text != 'undefined'
          ? block.text.text.split('_(').length > 1
          : false
      return result
    }
    let messages = []

    for await (const page of web.paginate('conversations.history', {
      channel: 'C01U8UCHZC1'
    })) {
      messages = messages.concat(page.messages)
    }
    messages = messages.filter(checkDinoPoll)

    messages = messages.map(message => ({
      results: message.blocks.filter(checkOption).map(block => ({
        tag: block.text.text.split('_(')[0].trim(),
        voters: block.text.text.split('_(')[1].split('\n')[1].split(', ')
      }))
    }))

    let people = {}

    messages.map(message => {
      message.results.map(area => {
        area.voters.map(voter => {
          if (typeof people[voter] == 'undefined') {
            people[voter] = [area.tag]
          } else {
            people[voter] = people[voter].concat([area.tag])
          }
        })
      })
    })
    let peopleArray = Object.entries(people).map(person => ({
      id: person[0],
      votes: person[1]
    }))

    let relationships = {}

    function similarity(x, y) {
      var score = 0
      x.votes.forEach(function (tx) {
        y.votes.forEach(function (ty) {
          if (tx == ty) score += 1
        })
      })
      if (y.id != '' && x.id != '') {
        if (typeof relationships[x.id] == 'undefined') {
          relationships[x.id] = [{ id: y.id, score: score / y.votes.length }]
        } else {
          relationships[x.id] = relationships[x.id].concat([
            { id: y.id, score: score / y.votes.length }
          ])
        }
      }
      return score
    }

    cluster(peopleArray, similarity)

    let relationshipsArray = Object.entries(relationships).map(person => ({
      id: person[0],
      relationships: person[1]
    }))

    for (let x in relationshipsArray) {
      relationshipsArray[x]['info'] = await web.users.info({
        user: relationshipsArray[x]['id'].replace('<@', '').replace('>', '')
      })
      relationshipsArray[x]['info'] = {
        avatar: relationshipsArray[x].info.user.profile.image_192,
        name: relationshipsArray[x].info.user.profile.display_name,
        id: relationshipsArray[x].info.user.id
      }
    }

    var slugger = new GithubSlugger()

    let allThePeople = {}

    let slugs = relationshipsArray.map(x => ({
      slug: slugger.slug(x.info.name),
      data: x,
      name: x.info.name,
      avatar: x.info.avatar
    }))

    relationshipsArray.map(x => {
      allThePeople[x.info.id] = {
        name: x.info.name,
        avatar: x.info.avatar
      }
    })

    let options = slugs.map(x => ({
      value: x.slug,
      name: x.name,
      photo: x.avatar
    }))

    function checkUser(user) {
      console.log(user.slug)
      console.log(params.slug)
      return user.slug == params.slug
    }

    console.log(slugs.filter(checkUser))
    console.log(allThePeople)
    let user = slugs.filter(checkUser)[0]
    let sortedArray = user.data.relationships
      .sort(function (a, b) {
        return a['score'] - b['score']
      })
      .reverse()

    let finalResults = {
      me: user,
      first: {
        data: sortedArray[0],
        userInfo:
          allThePeople[sortedArray[0]['id'].replace('<@', '').replace('>', '')]
      },
      ...(typeof sortedArray[1] != 'undefined'
        ? sortedArray[1].score > 0.4
          ? {
              second: {
                data: sortedArray[1],
                userInfo:
                  allThePeople[
                    sortedArray[1]['id'].replace('<@', '').replace('>', '')
                  ]
              }
            }
          : {}
        : {}),
      ...(typeof sortedArray[2] != 'undefined'
        ? sortedArray[2].score > 0.4
          ? {
              third: {
                data: sortedArray[2],
                userInfo:
                  allThePeople[
                    sortedArray[2]['id'].replace('<@', '').replace('>', '')
                  ]
              }
            }
          : {}
        : {}),
      ...(typeof sortedArray[3] != 'undefined'
        ? sortedArray[3].score > 0.4
          ? {
              fourth: {
                data: sortedArray[3],
                userInfo:
                  allThePeople[
                    sortedArray[3]['id'].replace('<@', '').replace('>', '')
                  ]
              }
            }
          : {}
        : {})
    }
    console.log(finalResults)
    return { props: { finalResults, slugs, options } }
  } catch {
    return { props: { notFound: true } }
  }
}
