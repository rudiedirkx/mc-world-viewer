const zlib = require('zlib');
const NbtReader = require('node-nbt').NbtReader;
const fs = require('fs');

fs.readFile(process.argv[2] || 'level.dat', function(err, data) {
	if (err) {
		console.log('fs error', err);
		return;
	}

	zlib.gunzip(data, function(err, buffer) {
		if (err) {
			console.log('zlib error', err);
			return;
		}

		var d = NbtReader.readTag(buffer);
		d = NbtReader.removeBufferKey(d);
		// console.log(d.val[0]);
		NbtReader.printAscii(d);
	});
});
