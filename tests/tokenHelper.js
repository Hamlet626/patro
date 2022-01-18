const anchor = require("@project-serum/anchor");
const serumCmn = require("@project-serum/common");
const TokenInstructions = require("@project-serum/serum").TokenInstructions;
const splToken = require("@solana/spl-token");
const {SystemProgram,LAMPORTS_PER_SOL} = anchor.web3;

const provider=anchor.Provider.local();

exports.getAccountBalance= async (pubkey)=>{
  let account=await provider.connection.getAccountInfo(pubkey);
  return account?.lamports??0;
}

exports.expectBalance=(actual,expected,message,slack=20000)=>{
  expect(actual,message).within(expected-slack,expected+slack);
}

exports.createUser=async(airdropBalance)=>{
  airdropBalance=airdropBalance??10*LAMPORTS_PER_SOL;
  let user=anchor.web3.Keypair.generate();
  let sig=await provider.connection.requestAirdrop(user.publicKey,airdropBalance);
  await provider.connection.confirmTransaction(sig);

  let wallet=new anchor.Wallet(user);
  let userProvider=new anchor.Provider(provider.connection,wallet,provider.opts);

  return {key:user,wallet,provider:userProvider};
}

function createUsers(numUsers){
  let promise=[];
  for(let i=0;i<numUsers;i++){promise.push(createUser());}
  return Promise.all(promise);
}

function programForUser(user,mainProgram){
  return new anchor.Program(mainProgram.idl,mainProgram.programId,user.provider);
}





const TOKEN_PROGRAM_ID = new anchor.web3.PublicKey(
  TokenInstructions.TOKEN_PROGRAM_ID.toString()
);

exports.getTokenAccount= async(provider, addr)=>{
  return await serumCmn.getTokenAccount(provider, addr);
}

exports.getMintInfo= async (provider, mintAddr) =>{
  return await serumCmn.getMintInfo(provider, mintAddr);
}

exports.createMint= async (provider, authority)=> {
  if (authority === undefined) {
    authority = provider.wallet.publicKey;
  }
  const mint = anchor.web3.Keypair.generate();
  const instructions = await createMintInstructions(
    provider,
    authority,
    mint.publicKey
  );

  const tx = new anchor.web3.Transaction();
  tx.add(...instructions);

  await provider.send(tx, [mint]);

  return mint.publicKey;
}

const createMintInstructions= async (provider, authority, mint)=> {
  let instructions = [
    anchor.web3.SystemProgram.createAccount({
      fromPubkey: provider.wallet.publicKey,
      newAccountPubkey: mint,
      space: 82,
      lamports: await provider.connection.getMinimumBalanceForRentExemption(82),
      programId: TOKEN_PROGRAM_ID,
    }),
    TokenInstructions.initializeMint({
      mint,
      decimals: 0,
      mintAuthority: authority,
    }),
  ];
  return instructions;
}

exports.createTokenAccount= async (provider, mint, owner)=>{
  const vault = anchor.web3.Keypair.generate();
  const tx = new anchor.web3.Transaction();
  tx.add(
    ...(await createTokenAccountInstrs(provider, vault.publicKey, mint, owner))
  );
  await provider.send(tx, [vault]);
  return vault.publicKey;
}

const createTokenAccountInstrs= async (
  provider,
  newAccountPubkey,
  mint,
  owner,
  lamports
) =>{
  if (lamports === undefined) {
    lamports = await provider.connection.getMinimumBalanceForRentExemption(165);
  }
  console.log(mint.toString());
  return [
    anchor.web3.SystemProgram.createAccount({
      fromPubkey: provider.wallet.publicKey,
      newAccountPubkey,
      space: 165,
      lamports,
      programId: TOKEN_PROGRAM_ID,
    }),
    TokenInstructions.initializeAccount({
      account: newAccountPubkey,
      mint,
      owner,
    }),
  ];
}

exports.mintTo = async (mint,dest,amount,mintAuth)=>{
  const tx = new anchor.web3.Transaction();
  tx.add(TokenInstructions.mintTo({
    mint:mint,destination:dest,amount:amount,mintAuthority:mintAuth.publicKey}));

  await provider.send(tx, [mintAuth]);
}