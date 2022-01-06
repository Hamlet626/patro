const anchor = require('@project-serum/anchor');
const helper=require('./tokenHelper');

const tokenKey="8Kten4Jk2h2RJNxQxro49WpBZkSob5HFmw5Mxpep68vM";
//const id_key="3E4zZqyQ2nT3NdWERQWkr3iHy2AcdTaryyFWRWUUAT2C";
describe('patro', () => {

  // Configure the client to use the local cluster.
    const provider=anchor.Provider.local();
  anchor.setProvider(provider);

  console.log(anchor.workspace);
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
        mint = anchor.web3.PublicKey(tokenKey);//await helper.createMint(provider);
        base_account= await helper.createTokenAccount(provider,mint,me);
        from = await helper.createTokenAccount(provider, mint, provider.wallet.publicKey);
        to = await helper.createTokenAccount(provider, mint, provider.wallet.publicKey);

        console.log(`token: ${mint}`);
        console.log(`base_account: ${base_account}`);
        console.log(`from: ${from}`);
        console.log(`to: ${to}`);
      });

  it('patro initialized!', async () => {

      let [patro,bump]=await anchor.web3.PublicKey.findProgramAddress(
                            ['patro',me.toBytes(),mint.toBytes()],
                            program.programId);

      const tx = await program.rpc.initialize(bump,
      {accounts:{
      patro:patro,
      token_addr:mint,
          base_account:base_account,
          admin:me,
          system_program: SystemProgram.programId,
      }},[provider.wallet]);

      let patroData=await program.account.Patro.fetch(patro);
      let baseAccData=await helper.getTokenAccount(provider,base_account);
      console.log(JSON.stringify(patroData));
      console.log(JSON.stringify(baseAccData));

      assert.ok(patroData.bump.eq(bump));
      assert.ok(patroData.admin.eq(me));
      assert.ok(patroData.base_account.eq(base_account));
      assert.ok(patroData.token_addr.eq(mint));
    });

});
