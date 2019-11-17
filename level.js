const zlib = require('zlib');
const nbt = require('nbt');
const fs = require('fs');

fs.readFile(process.argv[2] || 'level.dat', function(err, data) {
	if (err) {
		console.log('fs error', err);
		return;
	}

	nbt.parse(data, function(err, tree) {
		console.log(err, tree);
		process.stdout.write(JSON.stringify(tree, null, '  ') + '\n');
	});
});
