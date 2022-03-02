<script>
  import { Route } from 'tinro'
  import Create from './create.svelte'

  async function connect() {
    window.arweaveWallet.connect(['ACCESS_ADDRESS', 'SIGN_TRANSACTION'], {
      name: 'WAGMeeT',
    })
  }

  async function disconnect() {
    window.arweaveWallet.disconnect()
    console.log("Disconnected...")
  }
</script>

<header>
  <nav>
    <a href="/">Home</a>
    <a href="/create">Demo</a>
    <button on:click={connect}>Connect-Wallet</button>
    <button on:click={disconnect}>DisConnect</button>
  </nav>
  <h1>WAGMeet</h1>
  <p>Simple Arweave demo to create, sign and submit transaction.</p>
  <small>(open console to see results)</small>
</header>

<Route path="/create">
  <Create />
</Route>
