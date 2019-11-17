const zlib = require('zlib');
const NbtReader = require('node-nbt').NbtReader;
const fs = require('fs');

fs.readFile(process.argv[2] || 'r.0.0.mca', function(err, data) {
	if (err) {
		console.log('fs error', err);
		return;
	}

	let chunk1 = {};

	for ( let o = 0; o < 4096; o += 4 ) {
		let offset = data.readUIntBE(o, 3);
		let sectorCount = data.readUIntBE(o + 3, 1);
console.log(offset, sectorCount);

		chunk1.offset = offset;
		chunk1.sectorCount = sectorCount;

		break;
	}

	for ( let o = 4096; o < 8192; o += 4 ) {
		let utc = data.readUIntBE(o, 4);
		let date = new Date(utc * 1000);
console.log(String(date));

		chunk1.timestamp = utc;

		break;
	}

	chunk1.header = data.slice(chunk1.offset * 4096, chunk1.offset * 4096 + chunk1.sectorCount * 4096);
	chunk1.byteLength = chunk1.header.readUIntBE(0, 4);
	chunk1.compression = chunk1.header.readUIntBE(4, 1);
	chunk1.raw = data.slice(chunk1.offset * 4096 + 5, chunk1.offset * 4096 + 5 + chunk1.byteLength - 1);

console.log({byteLength: chunk1.byteLength, compression: chunk1.compression, rawLength: chunk1.raw.length});
// console.log(chunk1.raw);

	zlib.unzip(chunk1.raw, function(err, buffer) {
		if (err) {
			console.log('zlib error', err);
			return;
		}

		// console.log('buffer', buffer.length, buffer);
		// return;

		var d = NbtReader.readTag(buffer);
		d = NbtReader.removeBufferKey(d);
		// console.log(d.val[0]);
		NbtReader.printAscii(d);
	});

return;

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
