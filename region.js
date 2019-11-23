const zlib = require('zlib');
const nbt = require('nbt');
const fs = require('fs');

const READ_CHUNKS = 100; // max 1024
const CHUNK_DATA_OFFSET = 5;
const B4_MAP_TO_A = 'abcdefghijklmnopqrstuvwxyz+0123456789-ABCDEFGHIJKLMNOPQRSTUVWXYX';

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

function add4bInt(b4s, int) {
	b4s.push((int & 0x0000000f) >> 0);
	b4s.push((int & 0x000000f0) >> 4);
	b4s.push((int & 0x00000f00) >> 8);
	b4s.push((int & 0x0000f000) >> 12);
	b4s.push((int & 0x000f0000) >> 16);
	b4s.push((int & 0x00f00000) >> 20);
	b4s.push((int & 0x0f000000) >> 24);
	b4s.push((int & 0xf0000000) >> 28);
}

function extractChunkBlocks(chunk) {
	chunk.nbt.value.Level.value.Sections.value.value.forEach(section => {
		if (section.Palette) {
			section.Palette.value.value = section.Palette.value.value.map((type, i) => {
				return B4_MAP_TO_A[i] + ' = ' + type.Name.value;
			});
		}

		if (section.BlockStates) {
			const longs = section.BlockStates.value;
			const b4s = [];
			longs.forEach(([a, b]) => {
				add4bInt(b4s, a);
				add4bInt(b4s, b);
			});
console.log(b4s.length);
			section.BLOCKS = b4s.map(b => B4_MAP_TO_A[b]).join('');
		}
	});
	return chunk;
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

	const chunkGetters = [];
	for ( let i = 0; i < READ_CHUNKS; i++ ) {
		let o = i * 4;

		let sectorOffset = data.readUIntBE(o, 3);
		let sectorCount = data.readUIntBE(o + 3, 1);

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
		extractChunkBlocks(rand);
		debugChunk(`rand: ${i}`)(rand);

		fs.writeFileSync('chunk.json', JSON.stringify(rand.nbt));
	});
});
