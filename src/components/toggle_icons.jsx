import * as Util from '../helpers/util'

export const ToggleIcons = props => {
    const { checked, onChange, icons } = props

    const icon = {
        left: icons[0],
        right: icons[1],
    }

    return (
        <div className="group relative inline-flex w-11 shrink-0 rounded-full bg-gray-200 p-0.5 outline-offset-2 outline-indigo-600 ring-1 ring-inset ring-gray-900/5 transition-colors duration-200 ease-in-out has-[:checked]:bg-indigo-600 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 dark:bg-white/5 dark:outline-indigo-500 dark:ring-white/10 dark:has-[:checked]:bg-indigo-500">
            <span className="relative size-5 rounded-full bg-white shadow-sm ring-1 ring-gray-900/5 transition-transform duration-200 ease-in-out group-has-[:checked]:translate-x-5">
                <span
                    aria-hidden="true"
                    className="absolute inset-0 flex size-full items-center justify-center opacity-100 transition-opacity duration-200 ease-in group-has-[:checked]:opacity-0 group-has-[:checked]:duration-100 group-has-[:checked]:ease-out"
                >
                    <icon.left className="size-3 text-gray-400 dark:text-gray-600" />
                </span>
                <span
                    aria-hidden="true"
                    className="absolute inset-0 flex size-full items-center justify-center opacity-0 transition-opacity duration-100 ease-out group-has-[:checked]:opacity-100 group-has-[:checked]:duration-200 group-has-[:checked]:ease-in"
                >
                    <icon.right className="size-3 text-indigo-600 dark:text-indigo-500" />
                </span>
            </span>
            <input
                name="setting"
                type="checkbox"
                aria-label="Use setting"
                className="absolute inset-0 appearance-none focus:outline-none"
                checked={checked}
                onChange={onChange}
            />
        </div>
    )
}
