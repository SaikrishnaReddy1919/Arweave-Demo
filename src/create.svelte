<script>
  const arweave = Arweave.init({})
  console.log('---------Network Information--------')
  arweave.network.getInfo().then(console.log)
  let transaction

  async function createTransaction() {
    /**
     * There are two types of txns in arweave : one is data transaction (to upload data to arweave) and another one is like
     * a normal transfer transaction.
     */

    transaction = await arweave.createTransaction({
      // this txn data txn and is jus a string, but the data here can be anything. Ex: buffer from file.
      data:
        '<html><head><meta charset="UTF-8"><title>Hello worldd!</title></head><body></body></html>',
    })

    transaction.addTag('key4', 'value4') //changes dynamically..
    console.log('---------Transaction Created----------')
    console.log(transaction)
  }

  async function signTxn() {
    if (!transaction) {
      alert('Create txn')
      return
    }
    console.log('Signing txn....')
    await arweave.transactions.sign(transaction)
    console.log(transaction)
    console.log('---------Transaction Signed----------')
  }

  async function submitTxn() {
    if (!transaction.signature) {
      alert('Create and sign txn')
      return
    }
    console.log('Submitting txn....')
    // use post() for smaller data or for transfers
    try {
      await arweave.transactions.post(transaction)
      console.log('---------Transaction Submitted----------')
    } catch (error) {
      console.error(error)
    }
  }
</script>

<main style="text-align: center;">
  <button on:click={createTransaction}>Create-Txn</button>
  <button on:click={signTxn}>Sign-Txn</button>
  <button on:click={submitTxn}>Submit-Txn</button>
</main>
