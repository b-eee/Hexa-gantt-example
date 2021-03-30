const ganttModule = angular
	.module('gantt-custom', [
		'gantt.sortable',
		'gantt.movable',
		'gantt.drawtask',
		'gantt.tooltips',
		'gantt.bounds',
		'gantt.progress',
		'gantt.table',
		'gantt.tree',
		'gantt.groups',
		'gantt.resizeSensor',
		'gantt.overlap',
		'gantt.dependencies',
		'gantt',
	]);

export default ganttModule;
