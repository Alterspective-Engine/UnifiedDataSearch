namespace("Alt.UnifiedDataSearch.Services");

Alt.UnifiedDataSearch.Services.MockPmsService = function() {
    var self = this;
    
    // Store loaded data
    self.mockPersons = [];
    self.mockOrganisations = [];
    self.dataLoaded = false;
    self.loadingPromise = null;
    
    // Initialize mock data from JSON files
    self.initializeMockData = function() {
        // If already loading, return the existing promise
        if (self.loadingPromise) {
            return self.loadingPromise;
        }
        
        // If already loaded, return resolved promise
        if (self.dataLoaded) {
            return $.Deferred().resolve().promise();
        }
        
        // Load from JSON files
        self.loadingPromise = self.loadMockDataFromFiles();
        return self.loadingPromise;
    };
    
    // Load mock data from JSON files
    self.loadMockDataFromFiles = function() {
        var personsPromise = $.ajax({
            url: "/_ideFiles/Alt/UnifiedDataSearch/Blades/UnifiedOdsPmsSearch/mockPersonPmsData.json",
            dataType: "json"
        }).done(function(data) {
            self.mockPersons = data;
            console.log("Loaded " + data.length + " mock persons from JSON file");
        }).fail(function(error) {
            console.warn("Failed to load mock persons data, using fallback", error);
            self.loadFallbackPersons();
        });
        
        var orgsPromise = $.ajax({
            url: "/_ideFiles/Alt/UnifiedDataSearch/Blades/UnifiedOdsPmsSearch/mockOrganisationPmsData.json",
            dataType: "json"
        }).done(function(data) {
            self.mockOrganisations = data;
            console.log("Loaded " + data.length + " mock organisations from JSON file");
        }).fail(function(error) {
            console.warn("Failed to load mock organisations data, using fallback", error);
            self.loadFallbackOrganisations();
        });
        
        return $.when(personsPromise, orgsPromise).always(function() {
            self.dataLoaded = true;
        });
    };
    
    // Fallback data if JSON files can't be loaded
    self.loadFallbackPersons = function() {
        
        // Default mock data - some will match ODS data for testing conflicts
        self.mockPersons = [
            {
                id: "PMS-P001",
                firstName: "Igor",
                lastName: "Jericevich",
                email: "igor.j@alterspective.com", // Different email from ODS (igor@alterspective.com)
                phone: "0445555666", // Same phone as ODS
                dateOfBirth: "1985-06-20",
                address: "301 Tech Park", // Slightly different address from ODS (300 Tech Park)
                suburb: "Brisbane",
                postcode: "4001", // Different postcode from ODS (4000)
                state: "QLD",
                country: "Australia",
                source: "pms",
                odsType: "person"
            },
            {
                id: "PMS-P002",
                firstName: "Cameron",
                lastName: "Matthews",
                email: "cameron.matthews@mauriceblackburn.com.au",
                phone: "0412345678",
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
                id: "PMS-P003",
                firstName: "Rebecca",
                lastName: "Thompson",
                email: "rebecca.t@legalaid.com.au",
                phone: "0423456789",
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
                id: "PMS-P004",
                firstName: "Adrian",
                lastName: "Williams",
                email: "adrian.williams@chambers.com.au",
                phone: "0434567890",
                dateOfBirth: "1982-07-18",
                address: "321 George Street",
                suburb: "Sydney",
                postcode: "2000",
                state: "NSW",
                country: "Australia",
                source: "pms",
                odsType: "person"
            },
            {
                id: "PMS-P005",
                firstName: "Sarah",
                lastName: "Anderson",
                email: "sarah.anderson@lawfirm.com", // Same as ODS
                phone: "0412111223", // Slightly different from ODS (0412111222)
                dateOfBirth: "1982-04-15", // Same as ODS
                address: "100 Legal St",
                suburb: "Sydney",
                postcode: "2000",
                state: "NSW",
                source: "pms",
                odsType: "person"
            },
            {
                id: "PMS-P006",
                firstName: "Cameron",
                lastName: "Smith",
                email: "cam.smith@legal.net.au",
                phone: "0445678901",
                dateOfBirth: "1985-11-22",
                address: "567 Pitt Street",
                suburb: "Sydney",
                postcode: "2000",
                state: "NSW",
                country: "Australia",
                source: "pms",
                odsType: "person"
            },
            {
                id: "PMS-P007",
                firstName: "Rebecca",
                lastName: "Davis",
                email: "r.davis@lawpartners.com",
                phone: "0456789012",
                dateOfBirth: "1992-05-30",
                address: "890 Chapel Street",
                suburb: "South Yarra",
                postcode: "3141",
                state: "VIC",
                country: "Australia",
                source: "pms",
                odsType: "person"
            },
            {
                id: "PMS-P008",
                firstName: "Adrian",
                lastName: "O'Brien",
                email: "adrian.obrien@solicitor.com.au",
                phone: "0467890123",
                dateOfBirth: "1979-02-14",
                address: "234 William Street",
                suburb: "Perth",
                postcode: "6000",
                state: "WA",
                country: "Australia",
                source: "pms",
                odsType: "person"
            },
            {
                id: "PMS-P009",
                firstName: "Igor",
                lastName: "Petrov",
                email: "igor.petrov@consultant.com",
                phone: "0478901234",
                dateOfBirth: "1988-08-08",
                address: "678 King Street",
                suburb: "Newcastle",
                postcode: "2300",
                state: "NSW",
                source: "pms",
                odsType: "person"
            },
            {
                id: "PMS-P010",
                firstName: "Rebecca",
                lastName: "Cameron",
                email: "rebecca.cameron@barrister.com.au",
                phone: "0489012345",
                dateOfBirth: "1987-12-03",
                address: "999 Macquarie Street",
                suburb: "Sydney",
                postcode: "2000",
                state: "NSW",
                country: "Australia",
                source: "pms",
                odsType: "person"
            },
            {
                id: "PMS-P011",
                firstName: "Maria",
                lastName: "Garcia",
                email: "maria.garcia@business.net", // Different from ODS (m.garcia@business.com)
                phone: "0434444556", // Different from ODS (0434444555)
                dateOfBirth: "1991-06-15",
                address: "123 Bourke Street",
                suburb: "Melbourne",
                postcode: "3000",
                state: "VIC",
                source: "pms",
                odsType: "person"
            },
            {
                id: "PMS-P012",
                firstName: "Adrian",
                lastName: "Cameron",
                email: "a.cameron@advocate.com.au",
                phone: "0490123456",
                dateOfBirth: "1983-10-20",
                address: "555 Flinders Street",
                suburb: "Melbourne",
                postcode: "3000",
                state: "VIC",
                country: "Australia",
                source: "pms",
                odsType: "person"
            }
        ];
    };
    
    // Fallback organisations if JSON file can't be loaded
    self.loadFallbackOrganisations = function() {
        self.mockOrganisations = [
            {
                id: "PMS-O001",
                name: "Maurice Blackburn Lawyers",
                organisationName: "Maurice Blackburn Lawyers",
                tradingName: "Maurice Blackburn",
                abn: "21105657227",
                acn: "105657227",
                email: "info@mauriceblackburn.com.au",
                phone: "1800553577",
                address: "Level 21, 380 La Trobe Street",
                suburb: "Melbourne",
                postcode: "3000",
                state: "VIC",
                country: "Australia",
                source: "pms",
                odsType: "organisation"
            },
            {
                id: "PMS-O002",
                name: "Legal Solutions Pty Ltd",
                organisationName: "Legal Solutions Pty Ltd",
                tradingName: "Legal Solutions",
                abn: "11223344556", // Same ABN as ODS
                email: "enquiries@legalsolutions.com.au", // Different email from ODS (info@legalsolutions.com.au)
                phone: "0298887778", // Slightly different phone from ODS (0298887777)
                address: "456 Corporate Blvd",
                suburb: "Sydney",
                postcode: "2001", // Different from ODS
                state: "NSW",
                source: "pms",
                odsType: "organisation"
            },
            {
                id: "PMS-O003",
                name: "Alterspective Consulting",
                organisationName: "Alterspective Consulting Pty Ltd",
                tradingName: "Alterspective",
                abn: "98765432109",
                acn: "765432109",
                email: "info@alterspective.com",
                phone: "0387654321",
                address: "789 Technology Park",
                suburb: "Brisbane",
                postcode: "4000",
                state: "QLD",
                country: "Australia",
                source: "pms",
                odsType: "organisation"
            },
            {
                id: "PMS-O004",
                name: "Cameron & Associates Law Firm",
                organisationName: "Cameron & Associates Law Firm",
                tradingName: "Cameron Law",
                abn: "45678901234",
                email: "reception@cameronlaw.com.au",
                phone: "0276543210",
                address: "100 Legal Plaza",
                suburb: "Brisbane",
                postcode: "4000",
                state: "QLD",
                source: "pms",
                odsType: "organisation"
            },
            {
                id: "PMS-O005",
                name: "Corporate Advisory Services",
                organisationName: "Corporate Advisory Services", // Same as ODS
                tradingName: "CAS",
                abn: "22334455667", // Same as ODS
                email: "enquiries@cas.com.au", // Different from ODS (contact@cas.com.au)
                phone: "0298765432",
                address: "200 Business Centre", // Different address from ODS
                suburb: "Melbourne",
                postcode: "3001", // Different postcode
                state: "VIC",
                source: "pms",
                odsType: "organisation"
            },
            {
                id: "PMS-O006",
                name: "Rebecca Thompson Legal",
                organisationName: "Rebecca Thompson Legal Services",
                tradingName: "RT Legal",
                abn: "67890123456",
                email: "admin@rtlegal.com.au",
                phone: "0865432109",
                address: "50 Queen Street",
                suburb: "Perth",
                postcode: "6000",
                state: "WA",
                country: "Australia",
                source: "pms",
                odsType: "organisation"
            },
            {
                id: "PMS-O007",
                name: "Adrian Williams Chambers",
                organisationName: "Adrian Williams Chambers",
                tradingName: "AWC",
                abn: "78901234567",
                email: "clerks@awchambers.com.au",
                phone: "0212345678",
                address: "123 Phillip Street",
                suburb: "Sydney",
                postcode: "2000",
                state: "NSW",
                source: "pms",
                odsType: "organisation"
            },
            {
                id: "PMS-O008",
                name: "Global Insurance Group",
                organisationName: "Global Insurance Group Australia",
                tradingName: "GIG Australia",
                abn: "89012345678",
                acn: "012345678",
                email: "claims@giginsurance.com.au",
                phone: "1300123456",
                address: "Tower 2, 727 Collins Street",
                suburb: "Docklands",
                postcode: "3008",
                state: "VIC",
                country: "Australia",
                source: "pms",
                odsType: "organisation"
            },
            {
                id: "PMS-O009",
                name: "WorkCover Queensland",
                organisationName: "WorkCover Queensland",
                tradingName: "WorkCover QLD",
                abn: "90123456789",
                email: "info@workcoverqld.com.au",
                phone: "1300362128",
                address: "280 Adelaide Street",
                suburb: "Brisbane",
                postcode: "4000",
                state: "QLD",
                source: "pms",
                odsType: "organisation"
            },
            {
                id: "PMS-O010",
                name: "Medical Assessment Services",
                organisationName: "Medical Assessment Services Pty Ltd",
                tradingName: "MAS",
                abn: "01234567890",
                email: "bookings@medassess.com.au",
                phone: "0398765432",
                address: "456 Medical Centre",
                suburb: "Richmond",
                postcode: "3121",
                state: "VIC",
                country: "Australia",
                source: "pms",
                odsType: "organisation"
            }
        ];
    };
    
    self.search = function(type, query, page) {
        var deferred = $.Deferred();
        
        // Ensure data is loaded before searching
        var loadPromise = self.dataLoaded ? $.Deferred().resolve().promise() : self.initializeMockData();
        
        // Simulate network delay (300-700ms)
        var delay = 300 + Math.random() * 400;
        
        loadPromise.done(function() {
            setTimeout(function() {
                try {
                    var dataset = type === "persons" ? self.mockPersons : self.mockOrganisations;
                    var results = [];
                    
                    if (query && query.trim()) {
                        var searchTerm = query.toLowerCase();
                        results = dataset.filter(function(item) {
                            // Search in relevant fields based on type
                            if (type === "persons") {
                                return (
                                    (item.firstName && item.firstName.toLowerCase().indexOf(searchTerm) > -1) ||
                                    (item.lastName && item.lastName.toLowerCase().indexOf(searchTerm) > -1) ||
                                    (item.email && item.email.toLowerCase().indexOf(searchTerm) > -1) ||
                                    (item.phone && item.phone.indexOf(searchTerm) > -1)
                                );
                            } else {
                                return (
                                    (item.name && item.name.toLowerCase().indexOf(searchTerm) > -1) ||
                                    (item.organisationName && item.organisationName.toLowerCase().indexOf(searchTerm) > -1) ||
                                    (item.tradingName && item.tradingName.toLowerCase().indexOf(searchTerm) > -1) ||
                                    (item.abn && item.abn.indexOf(searchTerm) > -1) ||
                                    (item.email && item.email.toLowerCase().indexOf(searchTerm) > -1)
                                );
                            }
                        });
                    } else {
                        results = dataset;
                    }
                    
                    // Paginate results
                    var pageSize = 20; // Increased page size for better demonstration
                    var startIndex = (page || 0) * pageSize;
                    var paged = results.slice(startIndex, startIndex + pageSize);
                    
                    deferred.resolve({
                        success: true,
                        results: paged,
                        totalResults: results.length,
                        page: page || 0,
                        hasMore: results.length > startIndex + pageSize
                    });
                } catch(e) {
                    deferred.reject({
                        success: false,
                        error: e.message
                    });
                }
            }, delay);
        }).fail(function(error) {
            deferred.reject({
                success: false,
                error: "Failed to load mock data: " + error
            });
        });
        
        return deferred.promise();
    };
    
    // Add mock data methods for testing (in-memory only)
    self.addMockPerson = function(person) {
        // Ensure data is loaded first
        if (!self.dataLoaded) {
            console.warn("Mock data not loaded yet. Call initializeMockData() first.");
            return null;
        }
        person.id = "PMS-P" + (self.mockPersons.length + 1).toString().padStart(5, '0');
        person.source = "pms";
        person.odsType = "person";
        self.mockPersons.push(person);
        return person;
    };
    
    self.addMockOrganisation = function(organisation) {
        // Ensure data is loaded first
        if (!self.dataLoaded) {
            console.warn("Mock data not loaded yet. Call initializeMockData() first.");
            return null;
        }
        organisation.id = "PMS-O" + (self.mockOrganisations.length + 1).toString().padStart(5, '0');
        organisation.source = "pms";
        organisation.odsType = "organisation";
        self.mockOrganisations.push(organisation);
        return organisation;
    };
    
    self.clearMockData = function() {
        // Clear in-memory data only
        self.mockPersons = [];
        self.mockOrganisations = [];
        self.dataLoaded = false;
        self.loadingPromise = null;
    };
    
    // Method to reload data from files
    self.reloadFromFiles = function() {
        // Clear and reload from JSON files
        self.mockPersons = [];
        self.mockOrganisations = [];
        self.dataLoaded = false;
        self.loadingPromise = null;
        return self.initializeMockData();
    };
    
    // Don't auto-initialize - let it load on first search
};

// Create singleton instance
Alt.UnifiedDataSearch.Services.mockPmsService = new Alt.UnifiedDataSearch.Services.MockPmsService();