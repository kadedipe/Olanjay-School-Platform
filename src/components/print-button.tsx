"use client";export function PrintButton({label="Print or save PDF"}:{label?:string}){return <button className="primary noPrint" type="button" onClick={()=>window.print()}>{label}</button>;}
