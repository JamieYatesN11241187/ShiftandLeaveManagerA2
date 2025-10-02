class UserAccount {
    #id;
    #name;
    #email;
    #role;
    #dob;

    constructor({ id, name, email, role, dob }) {
        this.#id = id;
        this.#name = name;
        this.#email = email;
        this.#role = role;
        this.#dob = dob;
    }

    getId() { return this.#id; }
    getName() { return this.#name; }
    setName(name) { this.#name = name; }
    getEmail() { return this.#email; }
    setEmail(email) { this.#email = email; }
    getRole() { return this.#role; }
    setRole(role) { this.#role = role; }
    getDob() { return this.#dob; }
    setDob(dob) { this.#dob = dob; }

    getAge() {
        const today = new Date();
        const birthDate = new Date(this.#dob);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }

    getProfile() {
        return {
            id: this.getId(),
            name: this.getName(),
            email: this.getEmail(),
            role: this.getRole(),
            dob: this.getDob(),
            age: this.getAge()
        };
    }
}

class ManagerAccount extends UserAccount {
    constructor(props) {
        super(props);
    }

    approveShift(shiftId) {
        // Manager-specific logic
        return `Shift ${shiftId} approved by ${this.getName()}`;
    }
}

class WorkerAccount extends UserAccount {
    constructor(props) {
        super(props);
    }

    requestLeave(days) {
        // Worker-specific logic
        return `${this.getName()} requested ${days} days leave`;
    }
}

function createUserAccount(userDoc) {
    const baseProps = {
        id: userDoc.id || userDoc._id,
        name: userDoc.name,
        email: userDoc.email,
        role: userDoc.role,
        dob: userDoc.dob
    };
    if (userDoc.role === 'manager') {
        return new ManagerAccount(baseProps);
    } else {
        return new WorkerAccount(baseProps);
    }
}

module.exports = { UserAccount, ManagerAccount, WorkerAccount, createUserAccount };