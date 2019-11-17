const zlib = require('zlib');
const nbt = require('nbt');
const fs = require('fs');

const READ_CHUNKS = 100; // max 1024
const CHUNK_DATA_OFFSET = 5;

function getChunk(fileBuffer, sectorOffset, sectorCount = 1) {
	const chunk = {
		sectorOffset,
		rawCompressed: fileBuffer.slice(sectorOffset * 4096 + CHUNK_DATA_OFFSET, sectorOffset * 4096 + CHUNK_DATA_OFFSET + sectorCount * 4096),
	};
	return new Promise(resolve => {
		zlib.unzip(chunk.rawCompressed, function(err, buffer) {
			if (err) {
				return console.log(err);
			}

			chunk.rawNbt = buffer;
			nbt.parse(chunk.rawNbt, function(err, tree) {
				if (err) {
					return console.log(err);
				}

				chunk.nbt = tree;
				resolve(chunk);
			});
		});
	});
}

function debugChunk(name) {
	return function(chunk) {
		console.log({
			xPos: chunk.nbt.value.Level.value.xPos.value,
			zPos: chunk.nbt.value.Level.value.zPos.value,
			BiomesLength: chunk.nbt.value.Level.value.Biomes.value.length,
		});
		return chunk;
	};
}

fs.readFile(process.argv[2] || 'r.0.0.mca', function(err, data) {
	if (err) {
		console.log('fs error', err);
		return;
	}

	let chunk1 = {};

	const chunkGetters = [];
	for ( let i = 0; i < READ_CHUNKS; i++ ) {
		let o = i * 4;

		let sectorOffset = data.readUIntBE(o, 3);
		let sectorCount = data.readUIntBE(o + 3, 1);
// console.log(sectorOffset, sectorCount);

		chunk1.sectorOffset = sectorOffset;
		chunk1.sectorCount = sectorCount;

		chunkGetters.push(getChunk(data, sectorOffset, sectorCount));
	}

	Promise.all(chunkGetters).then(chunks => {
		console.log(`${chunks.length} chunks read`);

		let i, rand;
		i = Math.floor(Math.random() * chunks.length);
		rand = chunks[i];
		debugChunk(`rand: ${i}`)(rand);

		i = Math.floor(Math.random() * chunks.length);
		rand = chunks[i];
		debugChunk(`rand: ${i}`)(rand);
	});

	return;

// 	for ( let o = 4096; o < 8192; o += 4 ) {
// 		let utc = data.readUIntBE(o, 4);
// 		let date = new Date(utc * 1000);
// console.log(String(date));

// 		chunk1.timestamp = utc;

// 		break;
// 	}

	chunk1.header = data.slice(chunk1.sectorOffset * 4096, chunk1.sectorOffset * 4096 + chunk1.sectorCount * 4096);
	chunk1.byteLength = chunk1.header.readUIntBE(0, 4);
	chunk1.compression = chunk1.header.readUIntBE(4, 1);

	getChunk(data, chunk1.sectorOffset, chunk1.sectorCount).then(debugChunk('chunk1'));
});
