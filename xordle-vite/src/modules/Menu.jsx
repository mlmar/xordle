/**
 *  Start Menu Buttons
 */
const Menu = (props) => {
    const { options, onClick, className } = props;
    const getClassName = () => (className ? ' ' + className : '');

    const optionClickHandler = (event) => {
        const { id } = event.target;
        if (onClick && id) onClick(id);
    };

    return (
        <div className={'menu flex-col' + getClassName()} onClick={optionClickHandler}>
            {options.map(({ id, text }) => {
                return (
                    <button id={id} key={id}>
                        {text}
                    </button>
                );
            })}
        </div>
    );
};

export default Menu;
