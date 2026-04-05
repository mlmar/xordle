interface MenuProps {
    className?: string;
    options: MenuOption[];
    onClick?: (id: string) => void;
}

type MenuOption = { id: string; text: string };

/**
 *  Start Menu Buttons
 */
const Menu = (props: MenuProps) => {
    const { options, onClick, className } = props;

    const optionClickHandler = (event: React.MouseEvent) => {
        const { id } = event.target as HTMLButtonElement;
        if (onClick && id) onClick(id);
    };

    return (
        <menu className={('menu flex-col ' + className).trim()} onClick={optionClickHandler}>
            {options.map(({ id, text }: MenuOption) => {
                return (
                    <button id={id} key={id}>
                        {text}
                    </button>
                );
            })}
        </menu>
    );
};

export default Menu;
