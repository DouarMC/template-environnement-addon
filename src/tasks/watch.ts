import * as just_scripts from 'just-scripts';

const WATCH_TASK_NAME = 'watch-task';
just_scripts.option('watch');

export function watchTask(globs: string | string[], taskFunction: just_scripts.TaskFunction): just_scripts.TaskFunction {
    return () => {
        if (!just_scripts.argv().watch) {
            return taskFunction;
        }
        let taskInProgress = true;
        let pendingWork = false;
        const onFinished = (args) => {
            if (args.name === WATCH_TASK_NAME) {
                if (pendingWork) {
                    just_scripts.logger.info('Processing pending changes...');
                    pendingWork = false;
                    origTask(() => {});
                } else {
                    just_scripts.logger.info('Waiting for new changes...');
                    taskInProgress = false;
                }
            }
        }
        just_scripts.undertaker.on('start', function (args) {
            if (args.name === WATCH_TASK_NAME) {
                taskInProgress = true;
            }
        })
        just_scripts.undertaker.on('stop', function (args) {
            onFinished(args);
        })
        just_scripts.undertaker.on('error', function (args) {
            onFinished(args);
        })
        just_scripts.task(WATCH_TASK_NAME, just_scripts.series(taskFunction));
        let origTask = just_scripts.series(WATCH_TASK_NAME);
        origTask(() => {});
        just_scripts.watch(globs, () => {
            if (!taskInProgress) {
                origTask(() => {});
            } else {
                pendingWork = true;
            }
        })
        return Promise.resolve();
    }
}