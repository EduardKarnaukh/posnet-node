import { EventEmitter } from 'events';
import { SerialPort } from "serialport";
import * as dayjs from 'dayjs'
import { errors } from "./errors"
import { crc16_ccitt } from "./utils"
import type { PosnetItem } from './interfaces';

const STX = 0x02
const ETX = 0x03
const TAB = 0x09

export class Posnet extends EventEmitter {
    debug = false;
    eventEmitter = new EventEmitter();
    port?: SerialPort;
    transactionInited: boolean = false;

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
            Buffer.from(`na${item.name}`, 'ascii'),
            Buffer.from([TAB]),
            Buffer.from(`vt${item.vat}`, 'ascii'),
            Buffer.from([TAB]),
            Buffer.from(`pr${item.price}`, 'ascii'),
            Buffer.from([TAB]),
            Buffer.from(`rd${item.discountType === null ? true : item.discountType}`, 'ascii'),
            Buffer.from([TAB])
        ];

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
        // [STX]trinit[TAB]bm0[TAB]#CRC16[ETX]
        this.send(
            Buffer.concat([
                Buffer.from('trinit', 'ascii'),
                Buffer.from([TAB]),
                Buffer.from('bm0', 'ascii'),
                Buffer.from([TAB]),
            ])
        )

        return this;
    }

    /**
     * @description Prints the dayly report
     * @param {string} date - Date in format YYYY-MM-DD. Today by default.
     * @return {Posnet}
     */
    daylyReport(date: string = dayjs().format('YYYY-MM-DD')): Posnet {
        // [STX]dailyrep[TAB]da2007-02-19[TAB]#CRC16[ETX]
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
        // [STX]prncancel[TAB]#CRC16[ETX]
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

        this.port.write(buffer)
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