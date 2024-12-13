const fs = require('fs');
const path = require('path');
const { glob } = require('glob'); // 최신 glob 방식으로 변경
const { createObjectCsvWriter } = require('csv-writer');

// CSV 파일 작성 설정
const csvWriter = createObjectCsvWriter({
    path: 'controller_methods.csv',
    header: [
        { id: 'httpMethod', title: 'HTTP Method' },
        { id: 'methodName', title: 'Method Name' },
        { id: 'returnType', title: 'Return Type' },
        { id: 'parameters', title: 'Parameters' },
    ],
});

// Java 파일 탐색 함수
const findControllerFiles = async (dir) => {
    try {
        const files = await glob(`${dir}/**/*Controller.java`);
        console.log('탐색된 파일 목록:', files);
        return files;
    } catch (err) {
        console.error('파일 탐색 중 오류 발생:', err);
        return [];
    }
};

// 컨트롤러 메서드 파싱 함수
const parseControllerFile = (file) => {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    const methods = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line.startsWith('@PostMapping') || line.startsWith('@GetMapping') || line.startsWith('@PutMapping') || line.startsWith('@DeleteMapping')) {
            const httpMethod = line.match(/@(\w+Mapping)/)[1].replace('Mapping', '').toLowerCase();
            const methodSignatureLine = lines[i + 1]?.trim();
            const methodSignatureMatch = methodSignatureLine.match(/public\s+([\w<>, ]+)\s+(\w+)\(([\w<>,.@ ]*)\)/);

            if (methodSignatureMatch) {
                const returnType = methodSignatureMatch[1].trim();
                const methodName = methodSignatureMatch[2].trim();
                const parameters = methodSignatureMatch[3].trim();

                methods.push({
                    httpMethod,
                    methodName,
                    returnType,
                    parameters,
                });
            }
        }
    }

    return methods;
};

// 컨트롤러 파일 처리 함수
const processControllers = async (directory) => {
    try {
        const files = await findControllerFiles(directory);
        let allMethods = [];

        files.forEach((file) => {
            console.log('파일 이름:', file);
            const methods = parseControllerFile(file);
            console.log('파싱된 메서드:', methods);
            allMethods = allMethods.concat(methods);
        });

        if (allMethods.length > 0) {
            await csvWriter.writeRecords(allMethods);
            console.log(`CSV 파일이 생성되었습니다: controller_methods.csv`);
        } else {
            console.log('파싱된 메서드가 없습니다.');
        }
    } catch (error) {
        console.error('오류 발생:', error);
    }
};

// 프로젝트 디렉토리 설정
const projectDir = './src'; // Java Spring 프로젝트 경로
processControllers(projectDir);
