var gulp = require('gulp');
var shell = require('gulp-shell');

gulp.task('mongodb', shell.task(['sudo mongod']));
gulp.task('start', shell.task(['npm start']));

gulp.task('default', function(){
    gulp.run('mongodb', 'start');
    gulp.watch(
    	['./app.js',
    	 './db/**/*.js',
    	 './models/**/*.js',
    	 './route/**/*.js',
    	 './views/**/*.html'
    	],
    	function(){
    		console.log('test........................................................');
        	gulp.run('start');
    	}
    );
});