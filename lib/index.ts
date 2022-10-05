import { EventEmitter } from 'events';
import { SerialPort } from "serialport";
const { encode } = require('single-byte');
import * as dayjs from 'dayjs'
import { errors } from "./errors"
import { crc16_ccitt } from "./utils"
import type { PosnetChange, PosnetEndTransaction, PosnetItem, PosnetPayment, PosnetPromoDiscount, PosnetDiscountVat } from './interfaces';

const STX = 0x02
const ETX = 0x03
const TAB = 0x09
const FMT = 'fn200'
const LF = 0xA

export class Posnet extends EventEmitter {
    debug = false;
    eventEmitter = new EventEmitter();
    port?: SerialPort;
    transactionInited: boolean = false;
    formStarted: boolean =  false;

    constructor(debug: boolean = false) {
        super();

        this.debug = debug
    }

    /**
     * @description Open serial port, and start listening for data
     * @param { string } port
     * @returns { Posnet }
     */
    open(port: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.port = new SerialPort({
                path: port,
                baudRate: 9600,
                autoOpen: true
            })

            this.port.on('error', (error) => {
                reject(error);
                this.emit('error', error);
            });

            this.port.on('close', () => {
                reject();
                this.emit('close');
            });

            this.port.on('open', () => {
                resolve(true);
                this.emit('open');
            });

            this.port.on('readable', () => {
                if (!this.port) return;

                const data = this.port.read();
                if (this.debug) {
                    console.log('Posnet: Data received <<<<<<<< ', data.toString());
                }

                if (data.toString('utf-8', 1, 4) === 'ERR') {
                    const errorCode: string = data.toString('utf-8', 6, 8);
                    if (errors[parseInt(errorCode)]) {
                        this.emit('error', new Error(errors[parseInt(errorCode)]));
                    } else {
                        this.emit('error', new Error(`Unknown error: ${errorCode}`));
                    }
                }
            })
        })
    }

    /**
     * @description Start form for non-fiscal print
     * @returns { Posnet }
     */
    startForm(): Posnet {
        this.send(
            Buffer.concat([
                Buffer.from('formstart', 'ascii'),
                Buffer.from([TAB]),
                Buffer.from(FMT, 'ascii'),
                Buffer.from([TAB]),
                Buffer.from('fh75', 'ascii'),
                Buffer.from([TAB])
            ])
        )
        this.formStarted = true;

        return this;
    }

    /**
     * @description non-fiscal form end
     * @returns {Posnet}
     */
    endForm(): Posnet {
        this.send(
            Buffer.concat([
                Buffer.from('formend', 'ascii'),
                Buffer.from([TAB]),
                Buffer.from(FMT, 'ascii'),
                Buffer.from([TAB])
            ])
        )
        this.formStarted = false;

        return this;
    }

    /**
     * @description Print barcode. Form should be started
     * @param barcode 
     * @returns 
     */
    printBarcode(barcode: string): Posnet {
        if (!this.formStarted) throw Error('Form is not started');
        this.send(
            Buffer.concat([
                Buffer.from('formbarcode', 'ascii'),
                Buffer.from([TAB]), 
                Buffer.from('fn200', 'ascii'),
                Buffer.from([TAB]), 
                Buffer.from(`bc${barcode}`, 'ascii'),
                Buffer.from([TAB]),
            ])
        );

        return this;
    }


    /**
     * @description Print dots line. Form should be started
     * @returns { Posnet }
     */
    printDotLine(): Posnet {
        if (!this.formStarted) throw Error('Form is not started');
        this.send(
            Buffer.concat([
                Buffer.from('formcmd', 'ascii'),
                Buffer.from([TAB]), 
                Buffer.from('fn200', 'ascii'),
                Buffer.from([TAB]), 
                Buffer.from('cm1', 'ascii'),
                Buffer.from([TAB]),
            ])
        );

        return this;
    }

    printPromoDiscount(discount: PosnetPromoDiscount): Posnet {
        if (!this.transactionInited) throw Error('Transaction is not inited');
        this.send(
            Buffer.concat([
                Buffer.from('trdiscntpromo', 'ascii'),
                Buffer.from([TAB]), 
                Buffer.from(`rw${discount.value * 100}`, 'ascii'),
                Buffer.from([TAB]), 
                Buffer.from(`vt${discount.vat}`, 'ascii'),
                Buffer.from([TAB]), 
                encode('mazovia', `na${discount.name}`),
                //Buffer.from(`na${discount.name}`, 'ascii'),
                Buffer.from([TAB]), 
            ])
        );
        return this;
    }

    printDiscountVat(discount: PosnetDiscountVat): Posnet {
        if (!this.transactionInited) throw Error('Transaction is not inited');
        const data = [
            Buffer.from('trdiscntvat', 'ascii'),
            Buffer.from([TAB]), 
            Buffer.from(`vt${discount.vat}`, 'ascii'),
            Buffer.from([TAB]), 
            Buffer.from(`na${discount.name}`, 'ascii'),
            Buffer.from([TAB]), 
        ];

        if (discount.valueInPercent) {
            data.push(Buffer.from(`rp${discount.value}`, 'ascii'));
            data.push(Buffer.from([TAB]));
        } else {
            data.push(Buffer.from(`rw${discount.value * 100}`, 'ascii'));
            data.push(Buffer.from([TAB]));
        }

        this.send(
            Buffer.concat(data)
        );

        return this;
    }

    /**
     * @description Print text. Form should be started
     * @param {string} text 
     * @returns 
     */
    printText(text: string): Posnet {
        if (!this.formStarted) throw Error('Form is not started');
        this.send(
            Buffer.concat([
                Buffer.from('formline', 'ascii'),
                Buffer.from([TAB]), 
                Buffer.from(FMT, 'ascii'),
                Buffer.from([TAB]), 
                Buffer.from('fl664', 'ascii'),
                Buffer.from([TAB]),
                Buffer.from('s1', 'ascii'),
                encode('mazovia', text),
                //Buffer.from(text, 'ascii'),
                Buffer.from([LF]),
                Buffer.from([TAB]),
            ])
        );

        return this;
    }


    /**
     * @description Print payment for transaction.
     * @param { PosnetPayment } payment
     * @returns { Posnet }
     */
    printPayment(payment: PosnetPayment): Posnet {
        if (!this.transactionInited) throw Error('Transaction is not inited');

        const bufferData: Array<Buffer> = [
            Buffer.from('trpayment', 'ascii'),
            Buffer.from([TAB]),
            Buffer.from(`ty${payment.type}`, 'ascii'),
            Buffer.from([TAB]),
            Buffer.from(`wa${payment.amount * 100}`, 'ascii'),
            Buffer.from([TAB]),
            Buffer.from('re0', 'ascii'),
            Buffer.from([TAB]),
        ];

        this.send(Buffer.concat(bufferData));

        return this;
    }

    /**
     * @description Print change
     * @param {PosnetChange} change 
     * @returns 
     */
    printChange(change: PosnetChange) {
        if (!this.transactionInited) throw Error('Transaction is not inited');

        const bufferData: Array<Buffer> = [
            Buffer.from('trpayment', 'ascii'),
            Buffer.from([TAB]),
            Buffer.from(`ty${change.type}`, 'ascii'),
            Buffer.from([TAB]),
            Buffer.from(`wa${change.amount * 100}`, 'ascii'),
            Buffer.from([TAB]),
            Buffer.from('re1', 'ascii'),
            Buffer.from([TAB]),
        ];
        this.send(Buffer.concat(bufferData));

        return this;
    }

    /**
     * @description End of transaction.
     * @param {PosnetEndTransaction} transaction
     * @returns {Posnet}
     */
    endTransaction(transaction: PosnetEndTransaction): Posnet {
        if (!this.transactionInited) throw Error('Transaction is not inited');

        const bufferData: Array<Buffer> = [
            Buffer.from('trend', 'ascii'),
            Buffer.from([TAB]),
            Buffer.from(`to${transaction.subtotal * 100}`, 'ascii'),
            Buffer.from([TAB]),
            Buffer.from(`re${transaction.change * 100}`, 'ascii'),
            Buffer.from([TAB]),
            Buffer.from(`fp${transaction.paid * 100}`, 'ascii'),
            Buffer.from([TAB]),
        ];

        this.send(Buffer.concat(bufferData));

        return this;
    }

    /**
     * @description Print item on receipt. Should be used after initTransaction()
     * @param { PosnetItem } item
     * @returns { Posnet }
     */
    printItem(item: PosnetItem): Posnet {
        if (!this.transactionInited) throw Error('Transaction is not inited');
        if (!item.name) throw Error('Posnet: Item name is required');
        if (!item.vat) throw Error('Posnet: Item vat is required');
        if (!item.price) throw Error('Posnet: Item name is required');
        if (item.discountType && !item.discountName) {
            throw Error('Posnet: Item discount name is required when discount type is set');
        }

        if (item.discountType && !(item.amountDiscount || item.percentDiscount)) {
            throw Error('Posnet: Item discount amount or percent is required when discount type is set');
        }

        const bufferData: Array<Buffer> = [
            Buffer.from('trline', 'ascii'),
            Buffer.from([TAB]),
            encode('mazovia', `na${item.name}`),
            //Buffer.from(`na${item.name}`, 'utf-8'),
            Buffer.from([TAB]),
            Buffer.from(`vt${item.vat}`, 'ascii'),
            Buffer.from([TAB]),
            Buffer.from(`pr${item.price * 100}`, 'ascii'),
            Buffer.from([TAB]),
        ];
        
        if (item.discountType) bufferData.push(Buffer.from(`rd${item.discountType === null ? true : item.discountType}`, 'ascii'), Buffer.from([TAB]))
        if (item.cancellationFlag) bufferData.push(Buffer.from(`st${item.cancellationFlag}`, 'ascii'), Buffer.from([TAB]))
        if (item.totalAmount) bufferData.push(Buffer.from(`wa${item.totalAmount}`, 'ascii'), Buffer.from([TAB]))
        if (item.qty) bufferData.push(Buffer.from(`il${item.qty}`, 'ascii'), Buffer.from([TAB]))
        if (item.unit) bufferData.push(Buffer.from(`jm${item.unit}`, 'ascii'), Buffer.from([TAB]))
        if (item.discountName) bufferData.push(Buffer.from(`rn${item.discountName}`, 'ascii'), Buffer.from([TAB]))
        if (item.amountDiscount) bufferData.push(Buffer.from(`rp${item.amountDiscount}`, 'ascii'), Buffer.from([TAB]))
        if (item.percentDiscount) bufferData.push(Buffer.from(`rw${item.percentDiscount}`, 'ascii'), Buffer.from([TAB]))
        this.send(Buffer.concat(bufferData))

        return this;
    }

    /**
     * @description Transaction initialization. Should be used firstly.
     * @returns { Posnet }
     */
    initTransaction(): Posnet {
        this.cancel();
        this.send(
            Buffer.concat([
                Buffer.from('trinit', 'ascii'),
                Buffer.from([TAB]),
                Buffer.from('bm0', 'ascii'),
                Buffer.from([TAB]),
            ])
        )
        this.transactionInited = true;

        return this;
    }

    /**
     * @description Prints the dayly report
     * @param {string} date - Date in format YYYY-MM-DD. Today by default.
     * @return {Posnet}
     */
    daylyReport(date: string = dayjs().format('YYYY-MM-DD')): Posnet {
        this.send(
            Buffer.concat([
                Buffer.from('dailyrep', 'ascii'),
                Buffer.from([TAB]),
                Buffer.from(`da${date}`, 'ascii'),
                Buffer.from([TAB]),
            ])
        )

        return this;
    }

    /**
     * @description cancel previous transaction. If no transaction is in progress, nothing happens. Should be used before printing new form.
     * @returns {Posnet}
     */
    cancel(): Posnet {
        this.send(
            Buffer.concat([
                Buffer.from('prncancel', 'ascii'),
                Buffer.from([TAB])
            ])
        )
        this.transactionInited = false;

        return this;
    }

    /**
     * @description Prepare and send data to serial port
     * @param { Buffer } data 
     */
    send(data: Buffer) {
        if (!this.port) throw Error('Port is not open');

        const crc = crc16_ccitt(data);
        const buffer = Buffer.concat([
            Buffer.from([STX]),
            data,
            Buffer.from('#', 'ascii'),
            Buffer.from(crc.toString(16), 'ascii'),
            Buffer.from([ETX])
        ]);

        if (this.debug) {
            console.log('Posnet: Data send >>>>>>> : ', buffer.toString('utf-8'));
        }

        this.port.write(buffer);
    }

    /**
     * @description Create promise to make module sync
     * @param { Buffer } buffer
     * @returns {Promise<void>}
     */
    getPromise(data: Buffer): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!this.port) throw Error('Port is not open');

            this.port.write(data)
            this.port.drain(() => {
                resolve(true);
            })
        })
    }

    /**
     * @description Close serial port
     * @returns { Posnet }
     */
    close(): Posnet {
        if (this.port !== undefined) {
            this.port.close();
        }

        return this;
    }
}