const anchor = require("@project-serum/anchor");
const serumCmn = require("@project-serum/common");
const TokenInstructions = require("@project-serum/serum").TokenInstructions;
const {SystemProgram,LAMPORTS_PER_SOL} = anchor.web3;

const provider=anchor.Provider.local();

export async function getAccountBalance(pubkey){
  let account=await provider.connection.getAccountInfo(pubkey);
  return account?.lamports??0;
}

export function expectBalance(actual,expected,message,slack=20000){
  expect(actual,message).within(expected-slack,expected+slack);
}

export async function createUser(airdropBalance){
  airdropBalance=airdropBalance??10*LAMPORTS_PER_SOL;
  let user=anchor.web3.Keypair.generate();
  let sig=await provider.connection.requestAirdrop(user.publicKey,airdropBalance);
  await provider.connection.confirmTransaction(sig);

  let wallet=new anchor.Wallet(user);
  let userProvider=new anchor.Provider(provider.connection,wallet,provider.opts);

  return {key:user,wallet,provider:userProvider};
}

export function createUsers(numUsers){
  let promise=[];
  for(let i=0;i<numUsers;i++){promise.push(createUser());}
  return Promise.all(promise);
}

export function programForUser(user,mainProgram){
  return new anchor.Program(mainProgram.idl,mainProgram.programId,user.provider);
}





const TOKEN_PROGRAM_ID = new anchor.web3.PublicKey(
  TokenInstructions.TOKEN_PROGRAM_ID.toString()
);

export async function getTokenAccount(provider, addr) {
  return await serumCmn.getTokenAccount(provider, addr);
}

export async function getMintInfo(provider, mintAddr) {
  return await serumCmn.getMintInfo(provider, mintAddr);
}

export async function createMint(provider, authority) {
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

export async function createMintInstructions(provider, authority, mint) {
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

export async function createTokenAccount(provider, mint, owner) {
  const vault = anchor.web3.Keypair.generate();
  const tx = new anchor.web3.Transaction();
  tx.add(
    ...(await createTokenAccountInstrs(provider, vault.publicKey, mint, owner))
  );
  await provider.send(tx, [vault]);
  return vault.publicKey;
}

export async function createTokenAccountInstrs(
  provider,
  newAccountPubkey,
  mint,
  owner,
  lamports
) {
  if (lamports === undefined) {
    lamports = await provider.connection.getMinimumBalanceForRentExemption(165);
  }
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