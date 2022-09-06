"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Posnet = void 0;
var events_1 = require("events");
var serialport_1 = require("serialport");
var dayjs = require("dayjs");
var errors_1 = require("./errors");
var utils_1 = require("./utils");
var STX = 0x02;
var ETX = 0x03;
var TAB = 0x09;
var FMT = 'fn200';
var LF = 0xA;
var Posnet = /** @class */ (function (_super) {
    __extends(Posnet, _super);
    function Posnet(debug) {
        if (debug === void 0) { debug = false; }
        var _this = _super.call(this) || this;
        _this.debug = false;
        _this.eventEmitter = new events_1.EventEmitter();
        _this.transactionInited = false;
        _this.formStarted = false;
        _this.debug = debug;
        return _this;
    }
    /**
     * @description Open serial port, and start listening for data
     * @param { string } port
     * @returns { Posnet }
     */
    Posnet.prototype.open = function (port) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.port = new serialport_1.SerialPort({
                path: port,
                baudRate: 9600,
                autoOpen: true
            });
            _this.port.on('error', function (error) {
                reject(error);
                _this.emit('error', error);
            });
            _this.port.on('close', function () {
                reject();
                _this.emit('close');
            });
            _this.port.on('open', function () {
                resolve(true);
                _this.emit('open');
            });
            _this.port.on('readable', function () {
                if (!_this.port)
                    return;
                var data = _this.port.read();
                if (_this.debug) {
                    console.log('Posnet: Data received <<<<<<<< ', data.toString());
                }
                if (data.toString('utf-8', 1, 4) === 'ERR') {
                    var errorCode = data.toString('utf-8', 6, 8);
                    if (errors_1.errors[parseInt(errorCode)]) {
                        _this.emit('error', new Error(errors_1.errors[parseInt(errorCode)]));
                    }
                    else {
                        _this.emit('error', new Error("Unknown error: ".concat(errorCode)));
                    }
                }
            });
        });
    };
    /**
     * @description Start form for non-fiscal print
     * @returns { Posnet }
     */
    Posnet.prototype.startForm = function () {
        this.send(Buffer.concat([
            Buffer.from('formstart', 'ascii'),
            Buffer.from([TAB]),
            Buffer.from(FMT, 'ascii'),
            Buffer.from([TAB]),
            Buffer.from('fh75', 'ascii'),
            Buffer.from([TAB])
        ]));
        this.formStarted = true;
        return this;
    };
    /**
     * @description non-fiscal form end
     * @returns {Posnet}
     */
    Posnet.prototype.endForm = function () {
        this.send(Buffer.concat([
            Buffer.from('formend', 'ascii'),
            Buffer.from([TAB]),
            Buffer.from(FMT, 'ascii'),
            Buffer.from([TAB])
        ]));
        this.formStarted = false;
        return this;
    };
    /**
     * @description Print barcode. Form should be started
     * @param barcode
     * @returns
     */
    Posnet.prototype.printBarcode = function (barcode) {
        if (!this.formStarted)
            throw Error('Form is not started');
        this.send(Buffer.concat([
            Buffer.from('formbarcode', 'ascii'),
            Buffer.from([TAB]),
            Buffer.from('fn200', 'ascii'),
            Buffer.from([TAB]),
            Buffer.from("bc".concat(barcode), 'ascii'),
            Buffer.from([TAB]),
        ]));
        return this;
    };
    /**
     * @description Print dots line. Form should be started
     * @returns { Posnet }
     */
    Posnet.prototype.printDotLine = function () {
        if (!this.formStarted)
            throw Error('Form is not started');
        this.send(Buffer.concat([
            Buffer.from('formcmd', 'ascii'),
            Buffer.from([TAB]),
            Buffer.from('fn200', 'ascii'),
            Buffer.from([TAB]),
            Buffer.from('cm1', 'ascii'),
            Buffer.from([TAB]),
        ]));
        return this;
    };
    /**
     * @description Print text. Form should be started
     * @param {string} text
     * @returns
     */
    Posnet.prototype.printText = function (text) {
        if (!this.formStarted)
            throw Error('Form is not started');
        this.send(Buffer.concat([
            Buffer.from('formline', 'ascii'),
            Buffer.from([TAB]),
            Buffer.from(FMT, 'ascii'),
            Buffer.from([TAB]),
            Buffer.from('fl664', 'ascii'),
            Buffer.from([TAB]),
            Buffer.from('s1', 'ascii'),
            Buffer.from(text, 'ascii'),
            Buffer.from([LF]),
            Buffer.from([TAB]),
        ]));
        return this;
    };
    /**
     * @description Print payment for transaction.
     * @param { PosnetPayment } payment
     * @returns { Posnet }
     */
    Posnet.prototype.printPayment = function (payment) {
        if (!this.transactionInited)
            throw Error('Transaction is not inited');
        var bufferData = [
            Buffer.from('trpayment', 'ascii'),
            Buffer.from([TAB]),
            Buffer.from("ty".concat(payment.type), 'ascii'),
            Buffer.from([TAB]),
            Buffer.from("wa".concat(payment.amount * 100), 'ascii'),
            Buffer.from([TAB]),
            Buffer.from('re0', 'ascii'),
            Buffer.from([TAB]),
        ];
        this.send(Buffer.concat(bufferData));
        return this;
    };
    /**
     * @description Print change
     * @param {PosnetChange} change
     * @returns
     */
    Posnet.prototype.printChange = function (change) {
        if (!this.transactionInited)
            throw Error('Transaction is not inited');
        var bufferData = [
            Buffer.from('trpayment', 'ascii'),
            Buffer.from([TAB]),
            Buffer.from("ty".concat(change.type), 'ascii'),
            Buffer.from([TAB]),
            Buffer.from("wa".concat(change.amount * 100), 'ascii'),
            Buffer.from([TAB]),
            Buffer.from('re1', 'ascii'),
            Buffer.from([TAB]),
        ];
        this.send(Buffer.concat(bufferData));
        return this;
    };
    /**
     * @description End of transaction.
     * @param {PosnetEndTransaction} transaction
     * @returns {Posnet}
     */
    Posnet.prototype.endTransaction = function (transaction) {
        if (!this.transactionInited)
            throw Error('Transaction is not inited');
        var bufferData = [
            Buffer.from('trend', 'ascii'),
            Buffer.from([TAB]),
            Buffer.from("to".concat(transaction.subtotal * 100), 'ascii'),
            Buffer.from([TAB]),
            Buffer.from("re".concat(transaction.change * 100), 'ascii'),
            Buffer.from([TAB]),
            Buffer.from("fp".concat(transaction.paid * 100), 'ascii'),
            Buffer.from([TAB]),
        ];
        this.send(Buffer.concat(bufferData));
        return this;
    };
    /**
     * @description Print item on receipt. Should be used after initTransaction()
     * @param { PosnetItem } item
     * @returns { Posnet }
     */
    Posnet.prototype.printItem = function (item) {
        if (!this.transactionInited)
            throw Error('Transaction is not inited');
        if (!item.name)
            throw Error('Posnet: Item name is required');
        if (!item.vat)
            throw Error('Posnet: Item vat is required');
        if (!item.price)
            throw Error('Posnet: Item name is required');
        if (item.discountType && !item.discountName) {
            throw Error('Posnet: Item discount name is required when discount type is set');
        }
        if (item.discountType && !(item.amountDiscount || item.percentDiscount)) {
            throw Error('Posnet: Item discount amount or percent is required when discount type is set');
        }
        var bufferData = [
            Buffer.from('trline', 'ascii'),
            Buffer.from([TAB]),
            Buffer.from("na".concat(item.name), 'ascii'),
            Buffer.from([TAB]),
            Buffer.from("vt".concat(item.vat), 'ascii'),
            Buffer.from([TAB]),
            Buffer.from("pr".concat(item.price * 100), 'ascii'),
            Buffer.from([TAB]),
        ];
        if (item.discountType)
            bufferData.push(Buffer.from("rd".concat(item.discountType === null ? true : item.discountType), 'ascii'), Buffer.from([TAB]));
        if (item.cancellationFlag)
            bufferData.push(Buffer.from("st".concat(item.cancellationFlag), 'ascii'), Buffer.from([TAB]));
        if (item.totalAmount)
            bufferData.push(Buffer.from("wa".concat(item.totalAmount), 'ascii'), Buffer.from([TAB]));
        if (item.qty)
            bufferData.push(Buffer.from("il".concat(item.qty), 'ascii'), Buffer.from([TAB]));
        if (item.unit)
            bufferData.push(Buffer.from("jm".concat(item.unit), 'ascii'), Buffer.from([TAB]));
        if (item.discountName)
            bufferData.push(Buffer.from("rn".concat(item.discountName), 'ascii'), Buffer.from([TAB]));
        if (item.amountDiscount)
            bufferData.push(Buffer.from("rp".concat(item.amountDiscount), 'ascii'), Buffer.from([TAB]));
        if (item.percentDiscount)
            bufferData.push(Buffer.from("rw".concat(item.percentDiscount), 'ascii'), Buffer.from([TAB]));
        this.send(Buffer.concat(bufferData));
        return this;
    };
    /**
     * @description Transaction initialization. Should be used firstly.
     * @returns { Posnet }
     */
    Posnet.prototype.initTransaction = function () {
        this.cancel();
        this.send(Buffer.concat([
            Buffer.from('trinit', 'ascii'),
            Buffer.from([TAB]),
            Buffer.from('bm0', 'ascii'),
            Buffer.from([TAB]),
        ]));
        this.transactionInited = true;
        return this;
    };
    /**
     * @description Prints the dayly report
     * @param {string} date - Date in format YYYY-MM-DD. Today by default.
     * @return {Posnet}
     */
    Posnet.prototype.daylyReport = function (date) {
        if (date === void 0) { date = dayjs().format('YYYY-MM-DD'); }
        this.send(Buffer.concat([
            Buffer.from('dailyrep', 'ascii'),
            Buffer.from([TAB]),
            Buffer.from("da".concat(date), 'ascii'),
            Buffer.from([TAB]),
        ]));
        return this;
    };
    /**
     * @description cancel previous transaction. If no transaction is in progress, nothing happens. Should be used before printing new form.
     * @returns {Posnet}
     */
    Posnet.prototype.cancel = function () {
        this.send(Buffer.concat([
            Buffer.from('prncancel', 'ascii'),
            Buffer.from([TAB])
        ]));
        this.transactionInited = false;
        return this;
    };
    /**
     * @description Prepare and send data to serial port
     * @param { Buffer } data
     */
    Posnet.prototype.send = function (data) {
        if (!this.port)
            throw Error('Port is not open');
        var crc = (0, utils_1.crc16_ccitt)(data);
        var buffer = Buffer.concat([
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
    };
    /**
     * @description Create promise to make module sync
     * @param { Buffer } buffer
     * @returns {Promise<void>}
     */
    Posnet.prototype.getPromise = function (data) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (!_this.port)
                throw Error('Port is not open');
            _this.port.write(data);
            _this.port.drain(function () {
                resolve(true);
            });
        });
    };
    /**
     * @description Close serial port
     * @returns { Posnet }
     */
    Posnet.prototype.close = function () {
        if (this.port !== undefined) {
            this.port.close();
        }
        return this;
    };
    return Posnet;
}(events_1.EventEmitter));
exports.Posnet = Posnet;
