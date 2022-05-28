/**
 *  All Global variable to get and values from DOM.
 */
var file_contents = {};
var file_content_arr = [];
const files = document.getElementById('filePoster');
const startTerm = document.getElementById('start-term');
const startYear = document.getElementById('start-year');
const selectedCourse = document.getElementById('course');
const selectedTerm = document.getElementById('term');
const selectedGrade = document.getElementById('grade');
const preview = document.getElementById('show-text');
const schemaPreview = document.getElementById('schema-content');
const creditHours = document.getElementById('credit-hours')

var mybutton = document.getElementById("scrollTop");

// When the user scrolls down 20px from the top of the document, show the button
window.onscroll = function () { scrollFunction() };

function scrollFunction() {
    if (document.body.scrollTop > 40 || document.documentElement.scrollTop > 20) {
        mybutton.style.display = "block";
    } else {
        mybutton.style.display = "none";
    }
}

// When the user clicks on the button, scroll to the top of the document
function topFunction() {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
}

/**
 * CONSTANTS used across the script.
 */
const TERMS = ['Spring', 'Summer', 'Fall'];
const GRADES = {
    A: 4,
    B: 3,
    C: 2,
    F: 0,
}

/**
 * Calculaes CGPA of all completed cources.
 */
function getCgpa() {
    var cgpa = 0;
    var course_count = 0
    file_content_arr.forEach(course => {
        if (course[4]) {
            cgpa = cgpa + GRADES[course[4]]
            course_count = course_count + 1
        }
    })
    return course_count > 0 ? (cgpa / course_count).toFixed(2) : 0;
}

/**
 * This is Entry point of JS, All initilizations will be done here.
 * The Terms and Start years are fixed .
 */
function inIt() {

    TERMS.forEach(term => {
        startTerm.append(new Option(term, term));
    })

    for (let i = 0; i < 5; i++) {
        let year = (new Date()).getFullYear() - i;
        startYear.append(new Option(year, year))
    }

    Object.keys(GRADES).forEach(grade => {
        selectedGrade.append(new Option(grade, grade));
    });

    document.getElementById('cgpa').innerText = getCgpa();
}

/**
 * This function is reused to set updated courses and Year Terms.
 */
function reArrange() {
    setCourse();
    setTerm();
}

/**
 * This function will set dropdown values of Available courses.
 * The Available courses are those that have Null and 'F' grades and dependent course(s) are complete.
 */
function setCourse() {
    while (selectedCourse.children[1]) {
        console.log("IN WHIL");
        selectedCourse.removeChild(selectedCourse.children[1])
    }
    let courses = file_content_arr.filter(course => {
        if (course[2] == '' && course[4] == '') {
            return true
        } else if (course[2]) {
            for (let index = 0; index < file_contents[course[0]]['dependent'].length; index++) {
                const dependent_course = file_contents[course[0]]['dependent'][index];
                if (dependent_course && file_contents[dependent_course] && ['', 'F'].includes(file_contents[dependent_course]['grade']) || ['A', 'B', 'C'].includes(file_contents[course[0]]['grade'])) {
                    return false
                }
            }
            return true
        }
        return false
    }).map(course => course[0]);

    courses.forEach(course => {
        selectedCourse.append(new Option(course /*+ ` - (${file_contents[course]['code']})`*/, course))
    })
}

/**
 * This Function returns the next three comming terms of Course Ex: Fall 2021 will have [Spring 22 , Summer 22, Fall 22].
 * @param {String} start_term 
 * @param {Number} year 
 */
function formTerms(start_term, year) {
    let termsList = [];
    if (start_term) {
        let index = TERMS.findIndex(s => s == start_term) + 1;
        for (let i = 0; i < TERMS.length; i++) {
            if (index < TERMS.length) {
                termsList.push(`${TERMS[index]} ${year}`);
            } else {
                index = 0;
                year = year + 1
                termsList.push(`${TERMS[index]} ${year}`);
            }
            index += 1;
        }
    }
    return termsList
}

/**
 * This function will set dropdown values of Available Terms.
 * The Available Terms are those next three consegetive semesters of its dependent courses.
 */
function setTerm() {
    while (selectedTerm.children[1]) {
        selectedTerm.removeChild(selectedTerm.children[1])
    }

    let completed_at = null;
    try {
        completed_at = file_contents[file_contents[selectedCourse.value]["dependent"][file_contents[selectedCourse.value]["dependent"].length - 1]]["completed_at"]
    } catch (err) {
    }

    let termsList = [];
    if (completed_at) {
        var [start_term, year] = completed_at.split(" ")
        year = parseInt(year)
    } else {
        year = (new Date()).getFullYear()
        start_term = startTerm.value;
    }
    termsList = formTerms(start_term, year)

    termsList.forEach(term => {
        selectedTerm.append(new Option(term, term));
    })

    creditHours.innerHTML= file_contents[selectedCourse.value] ? file_contents[selectedCourse.value].code : ''
}

/**
 * To Check dependent Courses status we need to have hash to keep its data.
 */
function setFileContents() {
    file_contents = {};
    file_content_arr.forEach(course => {
        file_contents[course[0]] = {
            "course": course[0],
            "grade": course[4],
            "dependent": course[2].split(",").filter(e => !!e),
            "completed_at": course[3],
            "code": course[1],
        }
    })
}

/**
 * This is invoked when File/Schema uploaded .
 * It parses the schema.
 */
function onFileupload() {
    var file = document.querySelector('input[type=file]').files[0];
    var reader = new FileReader();

    if (file.type.match(/text.*/)) {
        reader.onload = function (event) {
            try {
                let content = event.target.result;
                file_content_arr = [];
                startTerm.value = '';
                startYear.value= '';
                content.split("\n").forEach(element => {
                    element = element.replace("\r", "")
                    let course = element.split('|');
                    if (course[2]) {
                        course[2] = course[2].split(',').map(a => {
                            let preq = a.trim().split(' ').filter(x => x.trim());
                            
                            if (preq.length > 1) {
                                if (!isNaN(preq[1].slice(-3))) {
                                    return preq.join(',')
                                }
                            }
                           
                            return a.trim();
                        })
                        let preq = course[2]
                        var seen = {};
                        var ret_arr = [];
                        for (var i = 0; i < preq.length; i++) {
                            if (!(preq[i] in seen)) {
                                ret_arr.push(preq[i]);
                                seen[preq[i]] = true;
                            }
                        }
                        course[2] = Object.keys(seen).join(',');
                    }

                    if (course[3] && course[3].trim()) {
                        let term_year = course[3].split(' ')
                        let t = TERMS.findIndex(x => x == term_year[0]);
                        let y = TERMS.findIndex(x => x == startTerm.value)
                        if(t<=y || y !=1) {
                            startTerm.value = term_year[0];
                        }
                        if(term_year[1] <= startYear.value || !startYear.value) {
                            startYear.value = term_year[1]
                        }
                    }
                    file_content_arr.push(course);
                });
                setFileContents();
                setCourse();
                setCompletedPeningCourses();
                // preview.innerHTML = '<pre>' + content + '</pre>';
                preview.innerHTML = '<span class="text-success">Schema upload success.</span> <a data-bs-toggle="offcanvas" data-bs-target="#offcanvas" href="#">View here</a>';
                schemaPreview.innerHTML = getSchemaContent();
                document.getElementById('cgpa').innerText = getCgpa();

            } catch (error) {
                console.warn(error);
                preview.innerHTML = "<span class='text-danger'>It doesn't seem to be a valid text file!</span>";
            }
        }
    } else {
        preview.innerHTML = "<span class='text-danger'>It doesn't seem to be a valid text file!</span>";
    }
    reader.readAsText(file);
}

/**
 * This Function is invoked on update button Click.
 * It updates schema, resets Form and Calculates CGPA.
 */
function onUpdate() {
    if (selectedGrade.value && selectedTerm.value) {
        for (let i = 0; i < file_content_arr.length; i++) {
            const course = file_content_arr[i];
            if (course[0] === selectedCourse.value) {
                file_content_arr[i][4] = selectedGrade.value;
                file_content_arr[i][3] = selectedTerm.value
                file_contents[course[0]]['grade'] = selectedGrade.value;
                file_contents[course[0]]['completed_at'] = selectedTerm.value;
            }
        }
        reArrange();
        setCompletedPeningCourses();
        schemaPreview.innerHTML = getSchemaContent();
        document.getElementById('cgpa').innerText = getCgpa();

        while (selectedGrade.children[1]) {
            selectedGrade.removeChild(selectedGrade.children[1])
        }
        Object.keys(GRADES).forEach(grade => {
            selectedGrade.append(new Option(grade, grade));
        });
        creditHours.innerHTML = ''
    }
}

function getSchemaContent() {
    return file_content_arr.map(s => s.join("|")).join("\n");
}

/**
 * This Function is invoked on download latest Schema.
 */
function downloadSchema() {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(getSchemaContent()));
    element.setAttribute('download', (new Date()).toLocaleString() + '-schema.txt');//file name set here
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

function setCompletedPeningCourses() {
    let tbody = document.getElementById('completed-courses')
    let tbodypeding = document.getElementById('pending-courses')

    let completedCourses = file_content_arr.filter(course => ['A', 'B', 'C'].includes(course[4])).map(course => `<tr><td>${course[0]}</td><td>${course[3]}</td><td>${course[4]}</td></tr>`);
    let peningCourses = file_content_arr.filter(course => !['A', 'B', 'C'].includes(course[4])).map(course => `<tr><td>${course[0]}</td><td>${course[2] ? course[2] : '----'}</td></tr>`);
    tbody.innerHTML = completedCourses.join('');
    tbodypeding.innerHTML = peningCourses.join('');
}

inIt();

//Duiplicate entries of course prereqs- Remove
//Remove local storage.
//Disable remaining fields until the file is loaded
//add Credit hours field. update credit hours div/span as and when we select course. Clear on update along with other fields on that row.
//Update download option -add some color
//CGPA realignement 