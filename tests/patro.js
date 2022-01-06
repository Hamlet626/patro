const anchor = require('@project-serum/anchor');
const helper=require('./tokenHelper');

const tokenKey="8Kten4Jk2h2RJNxQxro49WpBZkSob5HFmw5Mxpep68vM";
//const id_key="3E4zZqyQ2nT3NdWERQWkr3iHy2AcdTaryyFWRWUUAT2C";
describe('patro', () => {

  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.local());

const program = anchor.workspace.Patro;
//  it('Is initialized!', async () => {
//    // Add your test here.
//    const program = anchor.workspace.Patro;
//    const tx = await program.rpc.initialize();
//    console.log("Your transaction signature", tx);
//  });

    let mint = null;
    let base_account=null;
    let from = null;
    let to = null;

    let me=provider.wallet.publicKey;
    it("Initializes test state", async () => {
        [mint,base_account] = await createMint(provider);
        from = await createTokenAccount(provider, mint, provider.wallet.publicKey);
        to = await createTokenAccount(provider, mint, provider.wallet.publicKey);
      });

  it('patro initialized!', async () => {

      let [seed,bump]=await anchor.web3.PublicKey.findProgramAddress(
                            ['patro',me.toBytes(),mint.toBytes()],
                            program.programId);

      const tx = await program.rpc.initialize(bump,
      {accounts:{
      patro:
      pub token_addr:mint,
          base_account:base_account,
          pub admin:provider.wallet,
          system_program: SystemProgram.programId,
      }},[provider.wallet]);
      console.log("Your transaction signature", tx);
    });
});
