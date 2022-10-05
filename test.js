const { Posnet } = require('./dist/index');
const { PosnetEndTransaction } = require('./dist/interfaces');
const { PosnetChange } = require('./dist/interfaces');
const {PosnetItem, PosnetPayment, PosnetPromoDiscount, PosnetDiscountVat} = require('./dist/interfaces')
const { SerialPort } = require('serialport');

//     /dev/tty.usbmodem417696691

const printer = new Posnet(true);
const product = new PosnetItem({
    name: 'Sprzedaż towaru',
    vat: 2,
    price: 40.00,
    qty: 2
});

const product1 = new PosnetItem({
    name: 'Haircuting 1',
    vat: 2,
    price: 100.00,
    qty: 1
});

const paymentCash = new PosnetPayment({
    type: 'cash',
    amount: 200.00,
})

const paymentVoucher = new PosnetPayment({
    type: 'gift_voucher',
    amount: 20.00
})

const promo = new PosnetDiscountVat(2, 'bonuses', 10.00)

const change = new PosnetChange('cash', 30.00)

const end = new PosnetEndTransaction(170.00, 200.00, 30.00)

// SerialPort.list().then(ports => {
//     console.log(ports);
// })

printer.open('/dev/tty.usbmodem417696691').then(() => {
    printer
        .initTransaction()
        .printItem(product)
        .printItem(product1)
        .printDiscountVat(promo)
        .printPayment(paymentCash)
        .printChange(change)
        .endTransaction(end)
        // .cancel()
        // .startForm()
        // .printText('asdfsadfsdfsdf')
        // .printDotLine()
        // .printBarcode('123123123')
        // .endForm()
})

printer.on('open', () => {
    console.log('OPEN')
})

printer.on('posnet_error', (err) => {
    console.log(err)
})