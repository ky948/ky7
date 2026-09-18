import crypto from 'node:crypto';

export type BinanceOrderInput = { symbol:string; side:'BUY'|'SELL'; type:'MARKET'|'LIMIT'; quantity:number; price?:number; clientOrderId?:string };
export type BinanceWithdrawInput = { coin:string; address:string; amount:number; network?:string; addressTag?:string };

function required(name:string){const v=process.env[name]?.trim(); if(!v) throw new Error(`Missing required environment variable: ${name}`); return v;}
function sign(q:string,s:string){return crypto.createHmac('sha256',s).update(q).digest('hex');}
function form(p:Record<string,string|number|undefined>){return Object.entries(p).filter(([,v])=>v!==undefined).map(([k,v])=>`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&');}

export class BinanceSpotClient {
  private readonly baseUrl=process.env.BINANCE_BASE_URL?.trim()||'https://api.binance.com';
  private readonly apiKey=required('BINANCE_API_KEY');
  private readonly apiSecret=required('BINANCE_API_SECRET');
  private async signed(path:string,params:Record<string,string|number|undefined>){
    const payload=form({...params,recvWindow:process.env.BINANCE_RECV_WINDOW||5000,timestamp:Date.now()});
    const response=await fetch(`${this.baseUrl}${path}?${payload}&signature=${sign(payload,this.apiSecret)}`,{method:'POST',headers:{'X-MBX-APIKEY':this.apiKey}});
    const body=await response.json() as any; if(!response.ok) throw new Error(body?.msg||`Binance HTTP ${response.status}`); return body;
  }
  async accountRestrictions(){
    const payload=form({recvWindow:process.env.BINANCE_RECV_WINDOW||5000,timestamp:Date.now()});
    const response=await fetch(`${this.baseUrl}/sapi/v1/account/apiRestrictions?${payload}&signature=${sign(payload,this.apiSecret)}`,{headers:{'X-MBX-APIKEY':this.apiKey}});
    const body=await response.json() as any; if(!response.ok) throw new Error(body?.msg||`Binance HTTP ${response.status}`); return body;
  }
  async placeOrder(input:BinanceOrderInput){return this.signed('/api/v3/order',{symbol:input.symbol.replace('/',''),side:input.side,type:input.type,quantity:input.quantity,price:input.type==='LIMIT'?input.price:undefined,timeInForce:input.type==='LIMIT'?'GTC':undefined,newClientOrderId:input.clientOrderId,newOrderRespType:'FULL'});}
  async withdraw(input:BinanceWithdrawInput){
    if(process.env.BINANCE_ENABLE_WITHDRAWALS!=='true') throw new Error('Withdrawals are disabled.');
    const allowed=(process.env.BINANCE_WITHDRAW_ALLOWLIST||'').split(',').map(v=>v.trim()).filter(Boolean);
    if(!allowed.includes(input.address)) throw new Error('Withdrawal destination is not on BINANCE_WITHDRAW_ALLOWLIST.');
    if(input.amount<=0) throw new Error('Withdrawal amount must be positive.');
    return this.signed('/sapi/v1/capital/withdraw/apply',{coin:input.coin,address:input.address,amount:input.amount,network:input.network,addressTag:input.addressTag});
  }
}
export function binanceConfigured(){return Boolean(process.env.BINANCE_API_KEY&&process.env.BINANCE_API_SECRET);}
