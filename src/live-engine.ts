import { BinanceSpotClient } from './binance';

export type LiveSnapshot={balances:Array<{asset:string;free:number;locked:number;total:number}>;prices:Record<string,number>;tickers:Record<string,any>;openOrders:any[];navUsdt:number;freeUsdt:number;timestamp:number};
const DEFAULT_SYMBOLS=['BTC/USDT','ETH/USDT','SOL/USDT','AVAX/USDT','LINK/USDT'];

export class LiveTradingEngine{
 private client=new BinanceSpotClient(); private last:LiveSnapshot|null=null; private syncing=false;
 getClient(){return this.client;}
 async sync(symbols=DEFAULT_SYMBOLS){
  if(this.syncing&&this.last)return this.last; this.syncing=true;
  try{
   const [account,tickerData,openOrders]=await Promise.all([this.client.account(),this.client.ticker24h(),this.client.openOrders()]);
   const tickerArray=Array.isArray(tickerData)?tickerData:[tickerData]; const wanted=new Set(symbols.map(s=>s.replace('/','').toUpperCase()));
   const tickers=tickerArray.filter((t:any)=>wanted.has(t.symbol)).reduce((m:any,t:any)=>{m[t.symbol]=t;return m;},{});
   const prices:Record<string,number>={};
   for(const s of symbols){const t=tickers[s.replace('/','').toUpperCase()];if(t)prices[s]=Number(t.lastPrice);}
   const balances=(account?.balances||[]).filter((b:any)=>Number(b.free)+Number(b.locked)>0).map((b:any)=>({asset:b.asset,free:Number(b.free),locked:Number(b.locked),total:Number(b.free)+Number(b.locked)}));
   let navUsdt=0; for(const b of balances){if(b.asset==='USDT'){navUsdt+=b.total;continue;} const p=prices[b.asset+'/USDT'];if(p)navUsdt+=b.total*p;}
   const freeUsdt=balances.find(b=>b.asset==='USDT')?.free||0;
   this.last={balances,prices,tickers,openOrders,navUsdt,freeUsdt,timestamp:Date.now()}; return this.last;
  }finally{this.syncing=false;}
 }
 async readiness(){const permissions=await this.client.accountRestrictions();const account=await this.client.account();return {ready:permissions?.enableReading===true&&permissions?.enableSpotAndMarginTrading===true&&account?.canTrade===true,permissions:{enableReading:permissions?.enableReading,enableSpotAndMarginTrading:permissions?.enableSpotAndMarginTrading,enableWithdrawals:permissions?.enableWithdrawals,ipRestrict:permissions?.ipRestrict},canTrade:account?.canTrade===true,canWithdraw:account?.canWithdraw===true};}
 async placeSpotMarket(symbol:string,side:'BUY'|'SELL',quoteAmount:number){
  if(quoteAmount<=0)throw new Error('Order amount must be positive.');
  const maxAllocation=Number(process.env.MAX_CAPITAL_ALLOCATION||0.25);const maxPosition=Number(process.env.MAX_POSITION_SIZE||0.10);
  const snapshot=await this.sync([symbol]);const amount=Math.min(quoteAmount,snapshot.navUsdt*maxAllocation,snapshot.navUsdt*maxPosition);
  if(amount<10)throw new Error('Live order blocked: order value is below the $10 USDT safety floor.');
  if(side==='BUY'){if(amount>snapshot.freeUsdt)throw new Error('Insufficient free USDT balance.');return this.client.placeOrder({symbol,side,type:'MARKET',quoteOrderQty:Number(amount.toFixed(2)),clientOrderId:'ky7_'+Date.now()+'_'+Math.random().toString(36).slice(2,8)});}
  const asset=symbol.split('/')[0];const free=snapshot.balances.find(b=>b.asset===asset)?.free||0;const price=snapshot.prices[symbol];if(!price||free*price<amount)throw new Error('Insufficient free base-asset balance for sell.');
  const quantityRaw=amount/price;
  const info=await this.client.exchangeInfo(symbol);
  const filters=info?.symbols?.[0]?.filters||[];
  const lot=filters.find((f:any)=>f.filterType==='LOT_SIZE'||f.filterType==='MARKET_LOT_SIZE');
  const step=Number(lot?.stepSize||0);
  const quantity=step>0?Math.floor(quantityRaw/step)*step:quantityRaw;
  if(quantity<=0||Number(lot?.minQty||0)>quantity)throw new Error('Live sell blocked: quantity is below the exchange LOT_SIZE minimum.');
  return this.client.placeOrder({symbol,side,type:'MARKET',quantity,clientOrderId:'ky7_'+Date.now()+'_'+Math.random().toString(36).slice(2,8)});
 }
}