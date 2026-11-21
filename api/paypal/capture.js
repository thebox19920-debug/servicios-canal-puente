import {paypalVercelHandler} from '../../server/paypal-vercel.mjs';
export default function handler(req,res){return paypalVercelHandler(req,res,'capture');}
