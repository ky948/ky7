import crypto from 'node:crypto';

export type BinanceOrderInput = { symbol:string; side:'BUY'|'SELL'; type:'MARKET'|'LIMIT'; quantity?:number; quoteOrderQty?:number; price?:number; clientOrderId?:string };
export type BinanceWithdrawInput = { coin:string; address:string; amount:number; network?:string; addressTag?:string };
const enc=(v:unknown)=>encodeURIComponent(String(v));
const required=(name:string)=>{const v=process.env[name]?.trim(); if(!v) throw new Error('Missing required environment variable: '+name); return v;};
const form=(p:Record<string,unknown>)=>Object.entries(p).filter(([,v])=>v!==undefined&&v!==null).map(([k,v])=>enc(k)+'='+enc(v)).join('&');
const sign=(payload:string,secret:string)=>crypto.createHmac('sha256',secret).update(payload).digest('hex');
const sym=(s:string)=>s.replace('/','').toUpperCase();

export class BinanceSpotClient {
  private readonly baseUrl=process.env.BINANCE_BASE_URL?.trim()||'https://api.binance.com';
  private readonly apiKey=required('BINANCE_API_KEY');
  private readonly apiSecret=required('BINANCE_API_SECRET');
  private readonly recvWindow=Number(process.env.BINANCE_RECV_WINDOW||5000);
  private async request(path:string,method:'GET'|'POST'|'DELETE',params:Record<string,unknown>={},signed=false){
    const p=signed?{...params,recvWindow:this.recvWindow,timestamp:Date.now()}:params;
    const payload=form(p); const signature=signed?sign(payload,this.apiSecret):'';
    const qs=signature?(payload+'&signature='+signature):payload;
    const response=await fetch(this.baseUrl+path+(qs?'?'+qs:''),{method,headers:{'X-MBX-APIKEY':this.apiKey}});
    const body=await response.json().catch(()=>({}));
    if(!response.ok) throw new Error(body?.msg||('Binance HTTP '+response.status));
    return body;
  }
  async accountRestrictions(){return this.request('/sapi/v1/account/apiRestrictions','GET',{},true);}
  async account(){return this.request('/api/v3/account','GET',{},true);}
  async exchangeInfo(symbol?:string){return this.request('/api/v3/exchangeInfo','GET',symbol?{symbol:sym(symbol)}:{});}
  async ticker24h(symbol?:string){return this.request('/api/v3/ticker/24hr','GET',symbol?{symbol:sym(symbol)}:{});}
  async tickerPrice(symbol?:string){return this.request('/api/v3/ticker/price','GET',symbol?{symbol:sym(symbol)}:{});}
  async klines(symbol:string,interval='1m',limit=200){return this.request('/api/v3/klines','GET',{symbol:sym(symbol),interval,limit});}
  async openOrders(symbol?:string){return this.request('/api/v3/openOrders','GET',symbol?{symbol:sym(symbol)}:{},true);}
  async orderStatus(symbol:string,orderId?:number,origClientOrderId?:string){return this.request('/api/v3/order','GET',{symbol:sym(symbol),orderId,origClientOrderId},true);}
  async cancelOrder(symbol:string,orderId?:number,origClientOrderId?:string){return this.request('/api/v3/order','DELETE',{symbol:sym(symbol),orderId,origClientOrderId},true);}
  async placeOrder(input:BinanceOrderInput){
    if(input.type==='MARKET'&&!input.quantity&&!input.quoteOrderQty) throw new Error('MARKET order requires quantity or quoteOrderQty');
    if(input.type==='LIMIT'&&(!input.quantity||!input.price)) throw new Error('LIMIT order requires quantity and price');
    return this.request('/api/v3/order','POST',{symbol:sym(input.symbol),side:input.side,type:input.type,quantity:input.quantity,quoteOrderQty:input.quoteOrderQty,price:input.type==='LIMIT'?input.price:undefined,timeInForce:input.type==='LIMIT'?'GTC':undefined,newClientOrderId:input.clientOrderId,newOrderRespType:'FULL'},true);
  }
  async withdraw(input:BinanceWithdrawInput){
    if(process.env.BINANCE_ENABLE_WITHDRAWALS!=='true') throw new Error('Withdrawals are disabled.');
    const allowed=(process.env.BINANCE_WITHDRAW_ALLOWLIST||'').split(',').map(v=>v.trim()).filter(Boolean);
    if(!allowed.includes(input.address)) throw new Error('Withdrawal destination is not on BINANCE_WITHDRAW_ALLOWLIST.');
    if(input.amount<=0) throw new Error('Withdrawal amount must be positive.');
    return this.request('/sapi/v1/capital/withdraw/apply','POST',{coin:input.coin,address:input.address,amount:input.amount,network:input.network,addressTag:input.addressTag},true);
  }
}
export function binanceConfigured(){return Boolean(process.env.BINANCE_API_KEY&&process.env.BINANCE_API_SECRET);}