/// <reference types="node" />
/// <reference types="node" />
import { EventEmitter } from 'events';
import { SerialPort } from "serialport";
import type { PosnetChange, PosnetEndTransaction, PosnetItem, PosnetPayment, PosnetPromoDiscount, PosnetDiscountVat } from './interfaces';
export declare class Posnet extends EventEmitter {
    debug: boolean;
    eventEmitter: EventEmitter;
    port?: SerialPort;
    transactionInited: boolean;
    formStarted: boolean;
    constructor(debug?: boolean);
    /**
     * @description Open serial port, and start listening for data
     * @param { string } port
     * @returns { Posnet }
     */
    open(port: string): Promise<boolean>;
    /**
     * @description Start form for non-fiscal print
     * @returns { Posnet }
     */
    startForm(): Posnet;
    /**
     * @description non-fiscal form end
     * @returns {Posnet}
     */
    endForm(): Posnet;
    /**
     * @description Print barcode. Form should be started
     * @param barcode
     * @returns
     */
    printBarcode(barcode: string): Posnet;
    /**
     * @description Print dots line. Form should be started
     * @returns { Posnet }
     */
    printDotLine(): Posnet;
    printPromoDiscount(discount: PosnetPromoDiscount): Posnet;
    printDiscountVat(discount: PosnetDiscountVat): Posnet;
    /**
     * @description Print text. Form should be started
     * @param {string} text
     * @returns
     */
    printText(text: string): Posnet;
    /**
     * @description Print payment for transaction.
     * @param { PosnetPayment } payment
     * @returns { Posnet }
     */
    printPayment(payment: PosnetPayment): Posnet;
    /**
     * @description Print change
     * @param {PosnetChange} change
     * @returns
     */
    printChange(change: PosnetChange): this;
    /**
     * @description End of transaction.
     * @param {PosnetEndTransaction} transaction
     * @returns {Posnet}
     */
    endTransaction(transaction: PosnetEndTransaction): Posnet;
    /**
     * @description Print item on receipt. Should be used after initTransaction()
     * @param { PosnetItem } item
     * @returns { Posnet }
     */
    printItem(item: PosnetItem): Posnet;
    /**
     * @description Transaction initialization. Should be used firstly.
     * @returns { Posnet }
     */
    initTransaction(): Posnet;
    /**
     * @description Prints the dayly report
     * @param {string} date - Date in format YYYY-MM-DD. Today by default.
     * @return {Posnet}
     */
    daylyReport(date?: string): Posnet;
    /**
     * @description cancel previous transaction. If no transaction is in progress, nothing happens. Should be used before printing new form.
     * @returns {Posnet}
     */
    cancel(): Posnet;
    /**
     * @description Prepare and send data to serial port
     * @param { Buffer } data
     */
    send(data: Buffer): void;
    /**
     * @description Create promise to make module sync
     * @param { Buffer } buffer
     * @returns {Promise<void>}
     */
    getPromise(data: Buffer): Promise<any>;
    /**
     * @description Close serial port
     * @returns { Posnet }
     */
    close(): Posnet;
}
