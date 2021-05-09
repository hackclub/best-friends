import { Container, Heading, Text, Box, Flex, Link, Select } from 'theme-ui'
import SelectSearch, { fuzzySearch } from 'react-select-search/dist/cjs'
import { useRouter } from 'next/router'

export default function App({ relationshipsArray, slugs, options }) {
  const router = useRouter()
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
      <Flex sx={{ minHeight: '100vh', pt: '80px'}}>
        <Box sx={{ maxWidth: '75%' }}>
          <Heading sx={{ fontSize: '7em' }}>
            Who is your Hack Club{' '}
            <Text sx={t => t.util.gxText('red', 'orange')}>best friend?</Text>
          </Heading>
          <SelectSearch
            options={slugs}
            renderOption={renderFriend}
            search
            placeholder="Select yourself"
            filterOptions={fuzzySearch}
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
    </Container>
  )
}

export async function getStaticProps() {
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
    slug: slugger.slug(x.info.name),
    name: x.info.name,
    avatar: x.info.avatar
  }))

  let options = slugs.map(x => ({
    value: x.slug,
    name: x.name,
    photo: x.avatar
  }))
  return { props: { relationshipsArray, slugs, options } }
}
