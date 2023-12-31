const inquirer = require('inquirer');
const mysql = require('mysql2');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'companydb',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});


// Connection
// Creates the connection, pool, and prompts user by using menu functions
pool.query('CREATE DATABASE IF NOT EXISTS companydb;', (err, results) => {
    if (err) {
        console.error('Error creating companydb database:', err);
    } else {
        console.log('companydb database created successfully.');

        // Create the department table
        console.log('Creating department table...');
        pool.query(`
      CREATE TABLE IF NOT EXISTS department (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(30) NOT NULL
      );
    `, (err, results) => {
            if (err) {
                console.error('Error creating department table:', err);
            } else {
                console.log('Department table created successfully.');
            }
        });

        // Create the role table
        console.log('Creating role table...');
        pool.query(`
      CREATE TABLE IF NOT EXISTS role (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(30) NOT NULL,
        salary DECIMAL(10, 2) NOT NULL,
        department_id INT NOT NULL,
        FOREIGN KEY (department_id) REFERENCES department (id)
      );
    `, (err, results) => {
            if (err) {
                console.error('Error creating role table:', err);
            } else {
                console.log('Role table created successfully.');
            }
        });

        // Create the employee table
        console.log('Creating employee table...');
        pool.query(`
      CREATE TABLE IF NOT EXISTS employee (
        id INT PRIMARY KEY AUTO_INCREMENT,
        first_name VARCHAR(30) NOT NULL,
        last_name VARCHAR(30) NOT NULL,
        role_id INT NOT NULL,
        manager_id INT,
        FOREIGN KEY (role_id) REFERENCES role (id),
        FOREIGN KEY (manager_id) REFERENCES employee (id)
      );
    `, (err, results) => {
            if (err) {
                console.error('Error creating employee table:', err);
            } else {
                console.log('Employee table created successfully.');

                // Call the mainMenu function here
                displayLogo();
                mainMenu();
            }
        });
    }
});

// Queries for tables:
function viewAllEmployees() {
    pool.query('SELECT * FROM employee;', (err, results) => {
        if (err) {
            console.error('Error retrieving employees:', err);
        } else {
            console.table(results);
        }
        mainMenu(); // Return to the main menu
    });
}

function viewAllRoles() {
    pool.query('SELECT * FROM role;', (err, results) => {
        if (err) {
            console.error('Error retrieving roles:', err);
        } else {
            console.table(results);
        }
        mainMenu(); // Return to the main menu
    });
}

function viewAllDepartments() {
    pool.query('SELECT * FROM department;', (err, results) => {
        if (err) {
            console.error('Error retrieving departments:', err);
        } else {
            console.table(results);
        }
        mainMenu(); // Return to the main menu
    });
}

function getEmployeeNames() {
    return new Promise((resolve, reject) => {
        pool.query('SELECT first_name, last_name, id FROM employee;', (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}

function getEmployeeRoles() {
    return new Promise((resolve, reject) => {
        pool.query('SELECT id, title FROM role;', (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}

function getDepartmentNames() {
    return new Promise((resolve, reject) => {
        pool.query('SELECT name, id FROM department;', (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}




// Display logo function
function displayLogo(){
  console.log(
    `    _______________________________________________________
    |       ______                __                      |
    |	   / ____/___ ___  ____  / /___  __  _____  ___   |
    |	  / __/ / __ \`__ \\/ __ \\/ / __ \\/ / / / _ \\/ _ \\  |
    |	 / /___/ / / / / / /_/ / / /_/ / /_/ /  __/  __/  |
    |	/_____/_/_/_/ /_/ .___/_/\\____/\\__, /\\___/\\___/   |
    |	   /  |/  /___ /_/__  ____ ___/____/_  _____      |
    |	  / /|_/ / __ \`/ __ \\/ __ \`/ __ \`/ _ \\/ ___/      |
    |	 / /  / / /_/ / / / / /_/ / /_/ /  __/ /          |
    |	/_/  /_/\\__,_/_/ /_/\\__,_/\\__, /\\___/_/           |
    |                            /____/                   |
    |_____________________________________________________|`);

// Main Menu function
function mainMenu() {
    inquirer
        .prompt([{
            type: 'list',
            name: 'mainmenu',
            message: 'What would you like to do?',
            choices: [
                'View All Employees',
                'Add Employee',
                'Update Employee Role',
                'View All Roles',
                'Add Role',
                'View All Departments',
                'Add Department',
                'Quit'
            ]
        }])
        .then(choices => {

            // Submenu
            const selectedOption = choices.mainmenu;

            switch (selectedOption) {

                // Displays all employees
                case 'View All Employees':
                    console.log('View All Employees submenu');
                    viewAllEmployees();
                    break;

                // Adds employee to employee table
                case 'Add Employee':
                    inquirer
                        .prompt([{
                                type: 'input',
                                name: 'firstName',
                                message: `What is the employee's first name?`
                            },
                            {
                                type: 'input',
                                name: 'lastName',
                                message: `What is the employee's last name?`
                            },
                            {
                                type: 'list',
                                name: 'empRoleChoice',
                                message: 'What is the employee\'s role?',
                                choices: async () => {
                                    try {
                                        const employeeRoles = await getEmployeeRoles();
                                        return employeeRoles.map(role => ({
                                            name: role.title,
                                            value: role.id
                                        }));
                                    } catch (err) {
                                        console.error('Error retrieving employee roles:', err);
                                        return [];
                                    }
                                }
                            },
                            {
                                type: 'list',
                                name: 'empManChoice',
                                message: `Who is the employee's manager?`,
                                choices: async () => {
                                    try {
                                        const employeeData = await getEmployeeNames();
                                        const employeeNames = employeeData.map(employee => ({
                                            name: `${employee.first_name} ${employee.last_name}`,
                                            value: employee.id
                                        }));
                                        employeeNames.push({
                                            name: 'None',
                                            value: null
                                        });
                                        return employeeNames;
                                    } catch (err) {
                                        console.error('Error retrieving employee names:', err);
                                        return [];
                                    }
                                }
                            }
                        ])
                        .then(answers => {
                            const {
                                firstName,
                                lastName,
                                empRoleChoice,
                                empManChoice
                            } = answers;

                            pool.query(
                                'INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES (?, ?, ?, ?)',
                                [firstName, lastName, empRoleChoice, empManChoice],
                                (err, results) => {
                                    if (err) {
                                        console.error('Error adding employee:', err);
                                    } else {
                                        console.log('Employee added successfully.');
                                    }
                                    mainMenu(); 
                                }
                            );
                        });
                    break;

                // Changes employee role
                case 'Update Employee Role':
                    inquirer
                        .prompt([{
                                type: 'list',
                                name: 'employeeName',
                                message: 'Select an employee:',
                                choices: async () => {
                                    try {
                                        const employeeData = await getEmployeeNames();
                                        return employeeData.map(employee => ({
                                            name: `${employee.first_name} ${employee.last_name}`,
                                            value: employee.id
                                        }));
                                    } catch (err) {
                                        console.error('Error retrieving employee names:', err);
                                        return [];
                                    }
                                }
                            },
                            {
                                type: 'list',
                                name: 'newRole',
                                message: 'Select the new role:',
                                choices: async () => {
                                    try {
                                        const roleData = await getEmployeeRoles();
                                        return roleData.map(role => role.title);
                                    } catch (err) {
                                        console.error('Error retrieving employee roles:', err);
                                        return [];
                                    }
                                }
                            }
                        ])
                        .then(answers => {
                            const {
                                employeeName,
                                newRole
                            } = answers;

                            pool.query(
                                'UPDATE employee SET role_id = (SELECT id FROM role WHERE title = ?) WHERE id = ?',
                                [newRole, employeeName],
                                (err, results) => {
                                    if (err) {
                                        console.error('Error updating employee role:', err);
                                    } else {
                                        console.log('Employee role updated successfully.');
                                    }
                                    mainMenu(); 
                                }
                            );
                        });
                    break;


                // Displays all roles
                case 'View All Roles':
                    viewAllRoles();
                    break;


                // Adds role
                case 'Add Role':
                    inquirer
                        .prompt([{
                                type: 'input',
                                name: 'roleName',
                                message: 'What is the name of the role?'
                            },
                            {
                                type: 'input',
                                name: 'roleSalary',
                                message: 'What is the salary of the role?',
                                validate: input => {
                                    const number = Number(input);
                                    if (Number.isInteger(number)) {
                                        return true;
                                    } else {
                                        return 'Please enter a valid number.';
                                    }


                                }

                            },
                            {
                                type: 'list',
                                name: 'roleDept',
                                message: 'Which department does this role belong to?',
                                choices: async () => {
                                    try {
                                        const departments = await getDepartmentNames();
                                        return departments.map(dept => ({
                                            name: dept.name,
                                            value: dept.id
                                        }));
                                    } catch (err) {
                                        console.error('Error retrieving department list:', err);
                                        return [];
                                    }
                                }
                            }
                        ])
                        .then(answers => {
                            const {
                                roleName,
                                roleSalary,
                                roleDept
                            } = answers;

                            pool.query(
                                'INSERT INTO role (title, department_id, salary) VALUES (?, ?, ?)',
                                [roleName, roleDept, roleSalary],
                                (err, results) => {
                                    if (err) {
                                        console.error('Error adding role:', err);
                                    } else {
                                        console.log('Role added successfully.');
                                    }
                                    mainMenu();
                                }
                            );
                        });


                    break;
            
                // Displays all departments
                case 'View All Departments':
                    viewAllDepartments();
                    break;


                // Adds department
                case 'Add Department':
                    inquirer
                        .prompt([{
                            type: 'input',
                            name: 'newDept',
                            message: 'What is the name of the department?: '
                        }])
                        .then(answer => {
                            const {
                                newDept
                            } = answer;

                            pool.query(
                                'INSERT INTO department (name) VALUES (?)',
                                [newDept],
                                (err, results) => {
                                    if (err) {
                                        console.error('Error adding department:', err);
                                    } else {
                                        console.log('Department added successfully.');
                                    }
                                    mainMenu();
                                }
                            );
                        });
                    break;


                case 'Quit':
                    console.log('Goodbye!');
                    pool.end(); // Terminate the database connection pool
                    break;
                default:
                    console.log('Invalid option selected.');
                    mainMenu(); // Restart the main menu prompt
            }
        })
        .catch(error => {
            console.error('Error occurred:', error);
            pool.end(); // Terminate the database connection pool in case of error
        });
}
