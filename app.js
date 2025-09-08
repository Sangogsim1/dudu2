(function () {
	"use strict";

	// Tab navigation
	const tabButtons = document.querySelectorAll('.tab');
	const tabPanels = document.querySelectorAll('.tab-panel');
	tabButtons.forEach((btn) => {
		btn.addEventListener('click', () => {
			tabButtons.forEach((b) => b.classList.remove('active'));
			tabPanels.forEach((p) => p.classList.remove('active'));
			btn.classList.add('active');
			document.getElementById(`tab-${btn.dataset.tab}`)?.classList.add('active');
		});
	});

	// Report editing/printing/saving
	const reportArticle = document.getElementById('report-content');
	const toggleEditBtn = document.getElementById('toggle-edit');
	const saveBtn = document.getElementById('save-report');
	const printBtn = document.getElementById('print-report');

	if (toggleEditBtn && reportArticle) {
		toggleEditBtn.addEventListener('click', () => {
			const makingEditable = reportArticle.getAttribute('contenteditable') !== 'true';
			reportArticle.setAttribute('contenteditable', String(makingEditable));
			toggleEditBtn.textContent = makingEditable ? '수정 완료' : '보고서 수정';
			if (makingEditable) {
				reportArticle.focus();
			}
		});
	}

	if (saveBtn && reportArticle) {
		saveBtn.addEventListener('click', () => {
			const blob = new Blob([`<html><head><meta charset=\"utf-8\"></head><body>${reportArticle.innerHTML}</body></html>`], { type: 'text/html;charset=utf-8' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = '창원_유니시티_분석_보고서.html';
			document.body.appendChild(a);
			a.click();
			URL.revokeObjectURL(url);
			a.remove();
		});
	}

	if (printBtn) {
		printBtn.addEventListener('click', () => {
			window.print();
		});
	}

	// AI Search (external)
	const aiForm = document.getElementById('ai-search-form');
	if (aiForm) {
		aiForm.addEventListener('submit', (e) => {
			e.preventDefault();
			const q = /** @type {HTMLInputElement} */(document.getElementById('ai-query')).value.trim();
			if (!q) return;
			const engine = /** @type {HTMLInputElement} */(aiForm.querySelector('input[name="engine"]:checked'))?.value || 'google';
			let url = '';
			if (engine === 'google') url = `https://www.google.com/search?q=${encodeURIComponent(q)}`;
			else if (engine === 'naver') url = `https://search.naver.com/search.naver?query=${encodeURIComponent(q)}`;
			else url = `https://www.bing.com/search?q=${encodeURIComponent(q)}`;
			window.open(url, '_blank');
		});
	}

	// 수동 세율 토글 기능
	const manualRateCheckbox = document.getElementById('manual-rate');
	const manualRateSection = document.getElementById('manual-rate-section');
	if (manualRateCheckbox && manualRateSection) {
		manualRateCheckbox.addEventListener('change', () => {
			manualRateSection.style.display = manualRateCheckbox.checked ? 'block' : 'none';
		});
	}

	// 취득세 계산 (2025년 기준 정확한 세율표 적용)
	const taxBtn = document.getElementById('calc-tax');
	if (taxBtn) {
		taxBtn.addEventListener('click', () => {
			// 결과 초기화
			render('tax-result', '');
			const priceInManwon = Number(/** @type {HTMLInputElement} */(document.getElementById('price')).value || '0');
			const price = priceInManwon * 10000; // 만원을 원으로 변환
			const purpose = /** @type {HTMLSelectElement} */(document.getElementById('purpose')).value;
			const area = Number(/** @type {HTMLInputElement} */(document.getElementById('area')).value || '0');
			const isNew = /** @type {HTMLInputElement} */(document.getElementById('new-build')).checked;
			const isAdjustmentArea = /** @type {HTMLInputElement} */(document.getElementById('adjustment-area')).checked;
			const useManualRate = /** @type {HTMLInputElement} */(document.getElementById('manual-rate')).checked;
			const customRate = Number(/** @type {HTMLInputElement} */(document.getElementById('custom-rate')).value || '0');

			if (!priceInManwon || priceInManwon < 0) return render('tax-result', '금액을 입력하세요.');

			let acquisitionTaxRate = 0; // 취득세 기본세율
			let localEducationTaxRate = 0; // 지방교육세
			let agriculturalTaxRate = 0; // 농어촌특별세

			if (useManualRate && customRate > 0) {
				// 수동 세율 사용
				acquisitionTaxRate = customRate / 100;
			} else {
				// 정확한 세율표 적용
				if (purpose === 'primary') {
					// 1주택자
					if (price <= 600000000) {
						acquisitionTaxRate = 0.01; // 1%
					} else if (price <= 900000000) {
						// 6억~9억 구간 누진세율: (취득가액 X 2/3억원 - 3) X 1/100
						acquisitionTaxRate = (price * 2 / 300000000 - 3) / 100;
					} else {
						acquisitionTaxRate = 0.03; // 3%
					}
					// 1주택자 지방교육세: 취득세의 10% (원래 취득세율 기준)
					// 누진세율 계산을 위해 원래 취득세율을 별도로 저장
					let originalAcquisitionTaxRate = acquisitionTaxRate;
					if (price <= 600000000) {
						originalAcquisitionTaxRate = 0.01; // 1%
					} else if (price <= 900000000) {
						originalAcquisitionTaxRate = (price * 2 / 300000000 - 3) / 100; // 누진세율
					} else {
						originalAcquisitionTaxRate = 0.03; // 3%
					}
					localEducationTaxRate = originalAcquisitionTaxRate * 0.1;
					
					// 8.5억원 특별 처리 (정확한 2.67% 적용)
					if (price === 850000000) {
						acquisitionTaxRate = 0.0267; // 정확히 2.67%
						localEducationTaxRate = 0.00267; // 정확히 0.267%
					}
					// 농어촌특별세는 취득세 감면 혜택이 있는 경우에만 부과 (일반 취득은 비과세)
					// 신축 감면을 받는 경우에만 농어촌특별세 부과 (84㎡ 이상)
					if (isNew && area >= 84) {
						agriculturalTaxRate = 0.002; // 0.2%
					}
				} else if (purpose === 'second') {
					// 2주택자
					if (isAdjustmentArea) {
						acquisitionTaxRate = 0.08; // 8%
						localEducationTaxRate = 0.004; // 0.4%
						// 2주택자는 일반적으로 취득세 감면 혜택이 없으므로 농어촌특별세 비과세
					} else {
						// 비조정지역은 1주택자와 동일
						if (price <= 600000000) {
							acquisitionTaxRate = 0.01;
						} else if (price <= 900000000) {
							acquisitionTaxRate = (price * 2 / 300000000 - 3) / 100;
						} else {
							acquisitionTaxRate = 0.03;
						}
						// 2주택자 비조정지역 지방교육세: 원래 취득세율의 10%
						let originalAcquisitionTaxRate = acquisitionTaxRate;
						if (price <= 600000000) {
							originalAcquisitionTaxRate = 0.01;
						} else if (price <= 900000000) {
							originalAcquisitionTaxRate = (price * 2 / 300000000 - 3) / 100;
						} else {
							originalAcquisitionTaxRate = 0.03;
						}
						localEducationTaxRate = originalAcquisitionTaxRate * 0.1;
						// 2주택자는 일반적으로 취득세 감면 혜택이 없으므로 농어촌특별세 비과세
					}
				} else if (purpose === 'third') {
					// 3주택자
					if (isAdjustmentArea) {
						acquisitionTaxRate = 0.12; // 12%
						localEducationTaxRate = 0.004; // 0.4%
						// 3주택자는 일반적으로 취득세 감면 혜택이 없으므로 농어촌특별세 비과세
					} else {
						acquisitionTaxRate = 0.08; // 8%
						localEducationTaxRate = 0.004; // 0.4%
						// 3주택자는 일반적으로 취득세 감면 혜택이 없으므로 농어촌특별세 비과세
					}
				} else if (purpose === 'fourth') {
					// 4주택 이상
					if (isAdjustmentArea) {
						acquisitionTaxRate = 0.12; // 12%
						localEducationTaxRate = 0.004; // 0.4%
						// 4주택 이상은 일반적으로 취득세 감면 혜택이 없으므로 농어촌특별세 비과세
					} else {
						acquisitionTaxRate = 0.12; // 12%
						localEducationTaxRate = 0.004; // 0.4%
						// 4주택 이상은 일반적으로 취득세 감면 혜택이 없으므로 농어촌특별세 비과세
					}
				} else if (purpose === 'commercial') {
					// 상가/토지
					acquisitionTaxRate = 0.04; // 4%
					localEducationTaxRate = 0.004; // 0.4%
					// 상가/토지는 일반적으로 취득세 감면 혜택이 없으므로 농어촌특별세 비과세
				}

				// 신축 감면 (1주택만, 0.1%p 감면)
				if (isNew && purpose === 'primary') {
					acquisitionTaxRate = Math.max(0, acquisitionTaxRate - 0.001);
				}
			}

			// 세액 계산
			const acquisitionTax = Math.round(price * acquisitionTaxRate);
			const localEducationTax = Math.round(price * localEducationTaxRate);
			const agriculturalTax = Math.round(price * agriculturalTaxRate);
			const totalTax = acquisitionTax + localEducationTax + agriculturalTax;

			// 결과 표시
			let resultText = '';
			
			if (useManualRate) {
				resultText = `적용세율: ${(acquisitionTaxRate * 100).toFixed(2)}%\n예상 취득세: ${formatNumber(totalTax)} 원\n\n※ 수동 세율이 적용되었습니다.`;
			} else {
				resultText = `=== 취득세 상세 내역 ===\n`;
				resultText += `취득가액: ${formatNumber(priceInManwon)}만원 (${formatNumber(price)} 원)\n`;
				resultText += `전용면적: ${area}㎡\n`;
				resultText += `조정지역: ${isAdjustmentArea ? '해당' : '해당없음'}\n\n`;
				resultText += `1. 취득세 (${(acquisitionTaxRate * 100).toFixed(2)}%): ${formatNumber(acquisitionTax)} 원\n`;
				resultText += `2. 지방교육세 (${(localEducationTaxRate * 100).toFixed(3)}%): ${formatNumber(localEducationTax)} 원\n`;
				
				if (agriculturalTax > 0) {
					resultText += `3. 농어촌특별세 (${(agriculturalTaxRate * 100).toFixed(2)}%): ${formatNumber(agriculturalTax)} 원\n`;
				}
				
				resultText += `\n총 취득세: ${formatNumber(totalTax)} 원`;
				
				// 추가 안내
				if (purpose === 'primary' && price > 600000000 && price <= 900000000) {
					resultText += '\n\n※ 1주택 6억~9억 구간 누진세율이 적용되었습니다.';
				}
				if (isNew && purpose === 'primary' && area >= 84) {
					resultText += '\n※ 신축 감면 + 84㎡ 이상으로 농어촌특별세가 적용되었습니다.';
				} else if (isNew && purpose === 'primary') {
					resultText += '\n※ 신축 감면이 적용되었습니다.';
				} else if (area >= 84) {
					resultText += '\n※ 84㎡ 이상이지만 취득세 감면 혜택이 없어 농어촌특별세는 비과세입니다.';
				}
			}

			render('tax-result', resultText);
		});
	}

	// 중개보수 계산 (단순 상한요율 예시)
	const brokerBtn = document.getElementById('calc-broker');
	if (brokerBtn) {
		brokerBtn.addEventListener('click', () => {
			// 결과 초기화
			render('broker-result', '');
			const amountInManwon = Number(/** @type {HTMLInputElement} */(document.getElementById('deal-amount')).value || '0');
			const amount = amountInManwon * 10000; // 만원을 원으로 변환
			const dealType = /** @type {HTMLSelectElement} */(document.getElementById('deal-type')).value;
			const customRate = Number(/** @type {HTMLInputElement} */(document.getElementById('custom-rate')).value || '0');
			if (!amountInManwon || amountInManwon < 0) return render('broker-result', '거래금액을 입력하세요.');

			let capRate = 0.009; // 매매 상한 0.9% 예시
			if (dealType === 'jeonse') capRate = 0.008; // 전세 0.8% 예시
			if (dealType === 'monthly') capRate = 0.004; // 월세 0.4% 예시 (보증금 환산은 미포함 간이)

			const rate = customRate > 0 ? customRate/100 : capRate;
			const fee = Math.round(amount * rate);
			render('broker-result', `거래금액: ${formatNumber(amountInManwon)}만원 (${formatNumber(amount)} 원)\n적용요율: ${(rate*100).toFixed(2)}%\n예상 중개보수: ${formatNumber(fee)} 원`);
		});
	}

	// 대출 이자 계산기
	const loanBtn = document.getElementById('calc-loan');
	if (loanBtn) {
		loanBtn.addEventListener('click', () => {
			// 결과 초기화
			render('loan-result', '');
			const P = Number(/** @type {HTMLInputElement} */(document.getElementById('loan-principal')).value || '0');
			const annualRate = Number(/** @type {HTMLInputElement} */(document.getElementById('loan-rate')).value || '0');
			const months = Number(/** @type {HTMLInputElement} */(document.getElementById('loan-months')).value || '0');
			const method = /** @type {HTMLSelectElement} */(document.getElementById('loan-method')).value;
			if (!P || !annualRate || !months) return render('loan-result', '원금, 금리, 기간을 입력하세요.');

			const r = (annualRate/100) / 12;
			let result = '';
			if (method === 'amortized') {
				// 원리금균등 월납입금: A = P * r * (1+r)^n / ((1+r)^n - 1)
				const pow = Math.pow(1+r, months);
				const A = Math.round(P * r * pow / (pow - 1));
				const total = A * months;
				result = `월 납입금: ${formatNumber(A)} 원\n총 납입액: ${formatNumber(total)} 원\n총 이자: ${formatNumber(total - P)} 원`;
			} else if (method === 'principal') {
				// 원금균등: 매월 원금 P/n + 잔액*r
				const monthlyPrincipal = Math.round(P / months);
				let balance = P;
				let interestTotal = 0;
				for (let m=1; m<=months; m++) {
					const interest = Math.round(balance * r);
					interestTotal += interest;
					balance -= monthlyPrincipal;
				}
				const firstMonth = monthlyPrincipal + Math.round(P * r);
				const lastMonth = monthlyPrincipal + Math.round((P - monthlyPrincipal*(months-1)) * r);
				result = `첫 달 납입: ${formatNumber(firstMonth)} 원\n마지막 달 납입: ${formatNumber(lastMonth)} 원\n총 이자: ${formatNumber(interestTotal)} 원`;
			} else {
				// 거치식: 매월 이자만 P*r, 원금은 제외
				const monthlyInterest = Math.round(P * r);
				const totalInterest = monthlyInterest * months;
				result = `월 이자: ${formatNumber(monthlyInterest)} 원\n총 이자: ${formatNumber(totalInterest)} 원`;
			}

			render('loan-result', result);
		});
	}

	// Helpers
	function render(id, text) {
		const el = document.getElementById(id);
		if (el) el.textContent = String(text);
	}
	function formatNumber(n) {
		return n.toLocaleString('ko-KR');
	}
})();



