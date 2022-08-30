const { Posnet } = require('./dist/index')

//     /dev/tty.usbmodem417696691

const printer = new Posnet(true);
printer.open('/dev/tty.usbmodem417696691').then(() => {
    printer.initTransaction()
})