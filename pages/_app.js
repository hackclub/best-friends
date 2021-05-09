import * as React from 'react'
import NextApp from 'next/app'
import '../styles/select.css'
import '@hackclub/theme/fonts/reg-bold.css'
import theme from '@hackclub/theme'
import { ThemeProvider } from 'theme-ui'
import ColorSwitcher from '../components/color-switcher'
import Head from 'next/head'
import Meta from '@hackclub/meta'

export default class App extends NextApp {
  render() {
    const { Component, pageProps } = this.props
    return (
      <ThemeProvider theme={theme}>
        <Meta
          as={Head}
          name="Hack Club" // site name
          title="Best Friends" // page title
          description="Find out your best friend based on #poll-of-the-day results." // page description
          image="https://cloud-fjdua2ero-hack-club-bot.vercel.app/0best_friendsss.png" // large summary card image URL
          color="#ec3750" // theme color
        />
        <ColorSwitcher />
        <Component {...pageProps} />
      </ThemeProvider>
    )
  }
}
