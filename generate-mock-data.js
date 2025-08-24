// Script to generate mock PMS data
const fs = require('fs');
const path = require('path');

// Australian names, suburbs, and data
const firstNames = {
    male: ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Christopher',
           'Daniel', 'Paul', 'Mark', 'Donald', 'George', 'Kenneth', 'Steven', 'Edward', 'Brian', 'Ronald',
           'Anthony', 'Kevin', 'Jason', 'Matthew', 'Gary', 'Timothy', 'Jose', 'Larry', 'Jeffrey', 'Frank',
           'Scott', 'Eric', 'Stephen', 'Andrew', 'Peter', 'Raymond', 'Gregory', 'Joshua', 'Jerry', 'Dennis',
           'Cameron', 'Adrian', 'Igor', 'Nathan', 'Oliver', 'Lucas', 'Benjamin', 'Samuel', 'Henry', 'Alexander'],
    female: ['Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen',
            'Lisa', 'Nancy', 'Betty', 'Margaret', 'Sandra', 'Ashley', 'Kimberly', 'Emily', 'Donna', 'Michelle',
            'Carol', 'Amanda', 'Dorothy', 'Melissa', 'Deborah', 'Stephanie', 'Rebecca', 'Sharon', 'Laura', 'Cynthia',
            'Kathleen', 'Amy', 'Angela', 'Shirley', 'Anna', 'Brenda', 'Emma', 'Helen', 'Samantha', 'Debra',
            'Rachel', 'Carolyn', 'Janet', 'Catherine', 'Maria', 'Heather', 'Diane', 'Ruth', 'Julie', 'Olivia']
};

const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
                  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
                  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
                  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
                  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
                  'Cameron', 'Matthews', 'Thompson', 'Davidson', 'Williams', 'O\'Brien', 'Murphy', 'Kelly', 'Sullivan', 'Walsh',
                  'Chen', 'Wang', 'Li', 'Zhang', 'Liu', 'Singh', 'Kumar', 'Patel', 'Sharma', 'Gupta'];

const suburbs = [
    { name: 'Sydney', postcode: '2000', state: 'NSW' },
    { name: 'Melbourne', postcode: '3000', state: 'VIC' },
    { name: 'Brisbane', postcode: '4000', state: 'QLD' },
    { name: 'Perth', postcode: '6000', state: 'WA' },
    { name: 'Adelaide', postcode: '5000', state: 'SA' },
    { name: 'Hobart', postcode: '7000', state: 'TAS' },
    { name: 'Darwin', postcode: '0800', state: 'NT' },
    { name: 'Canberra', postcode: '2600', state: 'ACT' },
    { name: 'Parramatta', postcode: '2150', state: 'NSW' },
    { name: 'Chatswood', postcode: '2067', state: 'NSW' },
    { name: 'Bondi', postcode: '2026', state: 'NSW' },
    { name: 'Manly', postcode: '2095', state: 'NSW' },
    { name: 'Richmond', postcode: '3121', state: 'VIC' },
    { name: 'St Kilda', postcode: '3182', state: 'VIC' },
    { name: 'Fitzroy', postcode: '3065', state: 'VIC' },
    { name: 'South Yarra', postcode: '3141', state: 'VIC' },
    { name: 'Southbank', postcode: '4101', state: 'QLD' },
    { name: 'Fortitude Valley', postcode: '4006', state: 'QLD' },
    { name: 'Gold Coast', postcode: '4217', state: 'QLD' },
    { name: 'Fremantle', postcode: '6160', state: 'WA' },
    { name: 'Subiaco', postcode: '6008', state: 'WA' },
    { name: 'Glenelg', postcode: '5045', state: 'SA' },
    { name: 'North Sydney', postcode: '2060', state: 'NSW' },
    { name: 'Surry Hills', postcode: '2010', state: 'NSW' },
    { name: 'Newtown', postcode: '2042', state: 'NSW' },
    { name: 'Pyrmont', postcode: '2009', state: 'NSW' },
    { name: 'Docklands', postcode: '3008', state: 'VIC' },
    { name: 'Carlton', postcode: '3053', state: 'VIC' },
    { name: 'Prahran', postcode: '3181', state: 'VIC' },
    { name: 'Broadbeach', postcode: '4218', state: 'QLD' },
    { name: 'Cairns', postcode: '4870', state: 'QLD' },
    { name: 'Townsville', postcode: '4810', state: 'QLD' }
];

const streetNames = ['Main', 'High', 'Church', 'Market', 'King', 'Queen', 'Park', 'George', 'William', 'Elizabeth',
                    'Collins', 'Bourke', 'Swanston', 'Flinders', 'Spencer', 'Spring', 'Lonsdale', 'Russell', 'Exhibition', 'Pitt',
                    'Hunter', 'Macquarie', 'Martin', 'Clarence', 'York', 'Sussex', 'Kent', 'Phillip', 'Bridge', 'Oxford'];

const streetTypes = ['Street', 'Road', 'Avenue', 'Lane', 'Drive', 'Place', 'Court', 'Parade', 'Terrace', 'Way'];

const emailDomains = ['gmail.com', 'outlook.com', 'yahoo.com', 'example.com', 'email.com.au', 'bigpond.com', 
                     'optusnet.com.au', 'iinet.net.au', 'tpg.com.au', 'westnet.com.au'];

const companyTypes = ['Pty Ltd', 'Limited', 'Corporation', 'Group', 'Holdings', 'Services', 'Solutions', 'Partners', 
                      'Consulting', 'Advisory', 'Legal', 'Lawyers', 'Solicitors', 'Barristers', 'Chambers'];

const industries = ['Legal Services', 'Insurance', 'Healthcare', 'Construction', 'Retail', 'Manufacturing', 'Technology',
                    'Finance', 'Real Estate', 'Transport', 'Education', 'Government', 'Mining', 'Agriculture', 'Tourism'];

const businessNames = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Apex', 'Prime', 'Elite', 'Premium', 'Global', 'National',
                       'Regional', 'Metro', 'City', 'Urban', 'Central', 'North', 'South', 'East', 'West', 'Pacific',
                       'Atlantic', 'Continental', 'International', 'Universal', 'Dynamic', 'Strategic', 'Innovative', 'Advanced',
                       'Professional', 'Expert', 'Quality', 'Superior', 'Ultimate', 'Optimal', 'Maximum', 'Quantum'];

// Helper functions
function randomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generatePhone() {
    const prefix = Math.random() > 0.5 ? '04' : '03';
    const digits = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    return `+61 ${prefix.substring(1)}${digits.substring(0, 2)} ${digits.substring(2, 5)} ${digits.substring(5)}`;
}

function generateABN() {
    // Australian Business Number format: 11 digits
    return Math.floor(Math.random() * 90000000000 + 10000000000).toString();
}

function generateACN() {
    // Australian Company Number format: 9 digits
    return Math.floor(Math.random() * 900000000 + 100000000).toString();
}

function generateDateOfBirth() {
    const year = 1940 + Math.floor(Math.random() * 60);
    const month = Math.floor(Math.random() * 12) + 1;
    const day = Math.floor(Math.random() * 28) + 1;
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

// Generate persons
function generatePersons(count) {
    const persons = [];
    
    for (let i = 1; i <= count; i++) {
        const isMale = Math.random() > 0.5;
        const firstName = randomElement(isMale ? firstNames.male : firstNames.female);
        const lastName = randomElement(lastNames);
        const suburb = randomElement(suburbs);
        const streetNumber = Math.floor(Math.random() * 999) + 1;
        const streetName = randomElement(streetNames);
        const streetType = randomElement(streetTypes);
        
        const person = {
            id: `PMS-P${i.toString().padStart(5, '0')}`,
            firstName: firstName,
            lastName: lastName,
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${randomElement(emailDomains)}`.replace(/'/g, ''),
            phone: generatePhone(),
            dateOfBirth: Math.random() > 0.3 ? generateDateOfBirth() : null,
            address: `${streetNumber} ${streetName} ${streetType}`,
            suburb: suburb.name,
            postcode: suburb.postcode,
            state: suburb.state,
            country: 'Australia',
            source: 'pms',
            odsType: 'person'
        };
        
        // Add mobile phone for some
        if (Math.random() > 0.5) {
            person.mobile = generatePhone();
        }
        
        // Add middle name for some
        if (Math.random() > 0.7) {
            person.middleName = randomElement(isMale ? firstNames.male : firstNames.female);
        }
        
        // Add occupation for some
        if (Math.random() > 0.4) {
            person.occupation = randomElement(['Lawyer', 'Accountant', 'Engineer', 'Teacher', 'Nurse', 'Manager', 
                                             'Consultant', 'Developer', 'Designer', 'Analyst', 'Director', 'Officer']);
        }
        
        persons.push(person);
    }
    
    // Add specific test persons at the beginning
    const testPersons = [
        {
            id: "PMS-P00001",
            firstName: "Igor",
            lastName: "Jericevich",
            email: "igor.j@alterspective.com",
            phone: "+61 445 555 666",
            dateOfBirth: "1985-06-20",
            address: "301 Tech Park",
            suburb: "Brisbane",
            postcode: "4001",
            state: "QLD",
            country: "Australia",
            source: "pms",
            odsType: "person"
        },
        {
            id: "PMS-P00002",
            firstName: "Cameron",
            lastName: "Matthews",
            email: "cameron.matthews@mauriceblackburn.com.au",
            phone: "+61 412 345 678",
            dateOfBirth: "1978-09-12",
            address: "456 Collins Street",
            suburb: "Melbourne",
            postcode: "3000",
            state: "VIC",
            country: "Australia",
            source: "pms",
            odsType: "person"
        },
        {
            id: "PMS-P00003",
            firstName: "Rebecca",
            lastName: "Thompson",
            email: "rebecca.t@legalaid.com.au",
            phone: "+61 423 456 789",
            dateOfBirth: "1990-03-25",
            address: "789 Queen Street",
            suburb: "Brisbane",
            postcode: "4000",
            state: "QLD",
            country: "Australia",
            source: "pms",
            odsType: "person"
        },
        {
            id: "PMS-P00004",
            firstName: "Adrian",
            lastName: "Williams",
            email: "adrian.williams@chambers.com.au",
            phone: "+61 434 567 890",
            dateOfBirth: "1982-07-18",
            address: "321 George Street",
            suburb: "Sydney",
            postcode: "2000",
            state: "NSW",
            country: "Australia",
            source: "pms",
            odsType: "person"
        }
    ];
    
    // Replace first 4 with test persons
    persons.splice(0, 4, ...testPersons);
    
    return persons;
}

// Generate organisations
function generateOrganisations(count) {
    const organisations = [];
    
    for (let i = 1; i <= count; i++) {
        const businessName = randomElement(businessNames);
        const industry = randomElement(industries);
        const companyType = randomElement(companyTypes);
        const suburb = randomElement(suburbs);
        const streetNumber = Math.floor(Math.random() * 999) + 1;
        const streetName = randomElement(streetNames);
        const streetType = randomElement(streetTypes);
        
        const name = `${businessName} ${industry} ${companyType}`;
        const tradingName = `${businessName} ${industry.split(' ')[0]}`;
        
        const organisation = {
            id: `PMS-O${i.toString().padStart(5, '0')}`,
            name: name,
            organisationName: name,
            tradingName: tradingName,
            abn: generateABN(),
            acn: Math.random() > 0.5 ? generateACN() : null,
            email: `info@${businessName.toLowerCase()}.com.au`,
            phone: generatePhone(),
            address: `${streetNumber} ${streetName} ${streetType}`,
            suburb: suburb.name,
            postcode: suburb.postcode,
            state: suburb.state,
            country: 'Australia',
            source: 'pms',
            odsType: 'organisation'
        };
        
        // Add website for some
        if (Math.random() > 0.4) {
            organisation.website = `www.${businessName.toLowerCase()}.com.au`;
        }
        
        // Add fax for some
        if (Math.random() > 0.7) {
            organisation.fax = generatePhone();
        }
        
        // Add industry code for some
        if (Math.random() > 0.6) {
            organisation.industryCode = Math.floor(Math.random() * 9000 + 1000).toString();
        }
        
        organisations.push(organisation);
    }
    
    // Add specific test organisations at the beginning
    const testOrganisations = [
        {
            id: "PMS-O00001",
            name: "Maurice Blackburn Lawyers",
            organisationName: "Maurice Blackburn Lawyers",
            tradingName: "Maurice Blackburn",
            abn: "21105657227",
            acn: "105657227",
            email: "info@mauriceblackburn.com.au",
            phone: "+61 1800 553 577",
            address: "Level 21, 380 La Trobe Street",
            suburb: "Melbourne",
            postcode: "3000",
            state: "VIC",
            country: "Australia",
            source: "pms",
            odsType: "organisation"
        },
        {
            id: "PMS-O00002",
            name: "Legal Solutions Pty Ltd",
            organisationName: "Legal Solutions Pty Ltd",
            tradingName: "Legal Solutions",
            abn: "11223344556",
            email: "enquiries@legalsolutions.com.au",
            phone: "+61 298 887 778",
            address: "456 Corporate Blvd",
            suburb: "Sydney",
            postcode: "2001",
            state: "NSW",
            source: "pms",
            odsType: "organisation"
        },
        {
            id: "PMS-O00003",
            name: "Alterspective Consulting",
            organisationName: "Alterspective Consulting Pty Ltd",
            tradingName: "Alterspective",
            abn: "98765432109",
            acn: "765432109",
            email: "info@alterspective.com",
            phone: "+61 387 654 321",
            address: "789 Technology Park",
            suburb: "Brisbane",
            postcode: "4000",
            state: "QLD",
            country: "Australia",
            source: "pms",
            odsType: "organisation"
        }
    ];
    
    // Replace first 3 with test organisations
    organisations.splice(0, 3, ...testOrganisations);
    
    return organisations;
}

// Generate and save data
const persons = generatePersons(1000);
const organisations = generateOrganisations(1000);

// Save to files
const bladePath = path.join(__dirname, 'Blades', 'UnifiedOdsPmsSearch');

fs.writeFileSync(
    path.join(bladePath, 'mockPersonPmsData.json'),
    JSON.stringify(persons, null, 2)
);

fs.writeFileSync(
    path.join(bladePath, 'mockOrganisationPmsData.json'),
    JSON.stringify(organisations, null, 2)
);

console.log('Generated mock data files:');
console.log('- mockPersonPmsData.json (1000 persons)');
console.log('- mockOrganisationPmsData.json (1000 organisations)');