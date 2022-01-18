const anchor = require('@project-serum/anchor');
const helper=require('./tokenHelper');
const { SystemProgram } = anchor.web3;
const assert = require("assert");
const {TokenInstructions} = require("@project-serum/serum");
const expect = require('chai').expect;


const tokenKey="5A4bf5fUP8swk9V8tMiyVVup3Xog5QmGA8iuhRdQtZuw";
// "94uVN6Aa3aLmBRVfdafj1vj5dnG22F5YJyYRYhTLo3F";


const idTokenAccount= //"8dCG4AgXEbu2LZ3ZeRTJkGE6b2QHsGBp7tW83awPn4Ru";
"372PKGt8NKa6e8bbdR6ANUbYMWdFLCRFwiQ7VvU5DLE7";
//const id_key="3E4zZqyQ2nT3NdWERQWkr3iHy2AcdTaryyFWRWUUAT2C";
describe('patro', () => {

  // Configure the client to use the local cluster.
    const provider=anchor.Provider.local();
  anchor.setProvider(provider);

    const rentSysvar = anchor.web3.SYSVAR_RENT_PUBKEY;
    const clockSysvar = anchor.web3.SYSVAR_CLOCK_PUBKEY;
    const TOKEN_PROGRAM_ID = new anchor.web3.PublicKey(
        TokenInstructions.TOKEN_PROGRAM_ID.toString()
    );

    console.log(SystemProgram.programId);
  const program = anchor.workspace.Patro;

//  it('Is initialized!', async () => {
//    // Add your test here.
//    const program = anchor.workspace.Patro;
//    const tx = await program.rpc.initialize();
//    console.log("Your transaction signature", tx);
//  });

    let me=null;let u1=null;
    let mint = null;
    let base_account=null;
    let from = null;
    let to = null;

    let patro=null;
    let bump=null;
    let pt_auth=null;
    let pa_bump=null;

    let stake_acc=null; let sabump=null;

    const mint2=async (amount,dest)=>{
        const tx = await program.rpc.mintTo(new anchor.BN(amount),
            {accounts:{
                    patro:patro,
                    admin:me,
                    mintAuth:pt_auth,
                    tokenMint:mint,
                    userAccount:dest,
                    tokenProgram:TOKEN_PROGRAM_ID,
                }}
        );
    }
    it("Initializes test state", async () => {
        u1=(await helper.createUser(10)).key;
        me=provider.wallet.publicKey;//meKey.publicKey;
        console.log(me.toBase58());


        [patro,bump]=await anchor.web3.PublicKey.findProgramAddress(
            [Buffer.from('patro'),me.toBytes()
            ],
            program.programId);

        [pt_auth,pa_bump]=await anchor.web3.PublicKey.findProgramAddress(
            [Buffer.from('ptauth'),patro.toBuffer()
            ],
            program.programId);

        mint = await helper.createMint(provider,pt_auth);
        // new anchor.web3.PublicKey(tokenKey);

        base_account= await helper.createTokenAccount(provider,mint,me);
        // new anchor.web3.PublicKey(idTokenAccount);
        from = await helper.createTokenAccount(provider, mint, me);

        to = await helper.createTokenAccount(provider, mint, u1.publicKey);

        [stake_acc,sabump]=await anchor.web3.PublicKey.findProgramAddress(
            [Buffer.from('staker'),me.toBytes(),patro.toBytes()],
            program.programId);

        console.log(`token: ${mint}`);
        console.log(`base_account: ${base_account}`);
        console.log(`from: ${from}`);
        console.log(`to: ${to}`);
      });

    // return;
  it('patro initialized!', async () => {

      const tx = await program.rpc.initialize(bump,pa_bump,
          {accounts:{
              patro:patro,
                  tokenAddr:mint,
                  authority:pt_auth,
                  admin:me,
                  systemProgram: SystemProgram.programId,
              },
              // signers:[pt_auth]
          }//,[provider.wallet]
      );

      let patroData=await program.account.patro.fetch(patro);
      let baseAccData=await helper.getTokenAccount(provider,base_account);
      console.log(JSON.stringify(patroData));
      console.log(JSON.stringify(baseAccData));

      // assert.ok(patroData.bump.eq(bump));
      expect(patroData.admin.toString(),"check admin wallet").equals(me.toString());
      expect(patroData.authorityBump.toString(),"check admin account").equals(pa_bump.toString());
      expect(patroData.tokenAddr.toString(),"check token key").equals(mint.toString());
    });

  it("mint test",async()=>{
      await mint2(10,to);

      let toinfo=await helper.getTokenAccount(provider,to);
      let patroData=await program.account.patro.fetch(patro);
      console.log(toinfo);

      expect(to.amount,"check to balance").equals(10);
      expect(patroData.totalSupply,"check to balance").equals(10);
      expect(patroData.totalDistributed,"check to balance").equals(10);
  });

    it('stake account initialized!', async () => {

        await program.rpc.createStake(sabump,
            {accounts:{
                    patro:patro,
                    owner:me,
                    stakeAccount:stake_acc,
                    mint:mint,
                    systemProgram: SystemProgram.programId,
                },
                // signers:[provider.wallet]
            }//,[provider.wallet]
        );

        let sAccData=await program.account.stakeAccount.fetch(stake_acc);

        console.log(JSON.stringify(sAccData));

        // assert.ok(patroData.bump.eq(bump));
        expect(sAccData.patro.toString(),"check mint wallet").equals(patro.toString());
        expect(sAccData.owner.toString(),"check admin account").equals(me.toString());
        expect(sAccData.bump.toString(),"check bump").equals(sabump.toString());
    });

    it('stake test', async () => {

        await program.rpc.stake(new anchor.BN(10),
            {accounts:{
                    patro:patro,
                    owner:me,
                    stakeAccount:stake_acc,
                    mint:mint,
                    userAccount:from,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: SystemProgram.programId,
                    clock: clockSysvar,
                },
                // signers:[provider.wallet]
            }//,[provider.wallet]
        );

        let sAccData=await program.account.stakeAccount.fetch(stake_acc);

        console.log(JSON.stringify(sAccData));
        console.log(sAccData.since);
        expect(sAccData.amount,"check mint wallet").equals(new anchor.BN(10));

        let fromInfo=await helper.getTokenAccount(provider,from);
        let baseInfo=await helper.getTokenAccount(provider,base_account);

        console.log(fromInfo.amount);
        console.log(baseInfo.amount);
    });
});


